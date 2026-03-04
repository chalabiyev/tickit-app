package az.tickit.order;

import az.tickit.event.Event;
import az.tickit.event.EventRepository;
import az.tickit.order.dto.AdminOrderRequest;
import az.tickit.order.dto.CreateOrderRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final EventRepository eventRepository;

    public Order createOrder(CreateOrderRequest request) {
        // 1. Находим ивент
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        // 2. ЖЕЛЕЗНАЯ ПРОВЕРКА НА ПАУЗУ ПРОДАЖ
        if ("PAUSED".equalsIgnoreCase(event.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bu tədbir üçün bilet satışı müvəqqəti dayandırılıb!");
        }

        // 3. ГЛОБАЛЬНЫЙ ЛИМИТ БИЛЕТОВ НА EMAIL
        int maxTickets = (event.getMaxTicketsPerOrder() != null && event.getMaxTicketsPerOrder() > 0)
                ? event.getMaxTicketsPerOrder() : 10;
        int requestedTickets = request.getSeatIds().size();

        List<Order> existingOrders = orderRepository.findByCustomerEmailAndEventId(request.getCustomerEmail(), event.getId());
        int alreadyBought = 0;

        for (Order pastOrder : existingOrders) {
            if ("SUCCESS".equalsIgnoreCase(pastOrder.getStatus()) || "Ödənilib".equalsIgnoreCase(pastOrder.getStatus())) {
                alreadyBought += (pastOrder.getSeatIds() != null) ? pastOrder.getSeatIds().size() : 0;
            }
        }

        if (alreadyBought + requestedTickets > maxTickets) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Limit aşıldı! Siz bu tədbir üçün maksimum " + maxTickets +
                    " bilet ala bilərsiniz. Siz artıq " + alreadyBought + " bilet almısınız.");
        }

        if (event.getSoldSeats() == null) {
            event.setSoldSeats(new ArrayList<>());
        }

        // 5. ПРОВЕРКА: Не проданы ли уже эти места?
        for (String seatId : request.getSeatIds()) {
            if (event.getSoldSeats().contains(seatId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Oturacaq artıq satılıb: " + seatId);
            }
        }

        // 6. Создаем заказ
        Order order = new Order();
        order.setEventId(event.getId());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setSeatIds(request.getSeatIds());
        order.setTotalAmount(request.getTotalAmount());
        order.setStatus("SUCCESS");
        order.setCreatedAt(LocalDateTime.now());

        // --- МАГИЯ QR-КОДОВ
        List<OrderTicket> generatedTickets = request.getSeatIds().stream().map(seatId -> {
            OrderTicket ticket = new OrderTicket();
            ticket.setSeatId(seatId);
            ticket.setQrCode(UUID.randomUUID().toString());
            ticket.setScanned(false);
            return ticket;
        }).collect(Collectors.toList());

        order.setTickets(generatedTickets);

        Order savedOrder = orderRepository.save(order);

        // 7. Обновляем ивент
        event.getSoldSeats().addAll(request.getSeatIds());
        int currentSold = (event.getSold() == null) ? 0 : event.getSold();
        event.setSold(currentSold + request.getSeatIds().size());

        eventRepository.save(event);

        return savedOrder;
    }

    public String scanTicket(String qrCode) {
        Order order = orderRepository.findByTickets_QrCode(qrCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bilet tapılmadı və ya saxtadır!"));

        OrderTicket matchedTicket = order.getTickets().stream()
                .filter(t -> t.getQrCode().equals(qrCode))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bilet tapılmadı!"));

        if (matchedTicket.isScanned()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DİQQƏT: Bu bilet artıq istifadə olunub!");
        }

        matchedTicket.setScanned(true);
        orderRepository.save(order);

        return "Uğurlu! Girişə icazə verildi. (Yer: " + matchedTicket.getSeatId() + ")";
    }

    public Order createAdminOrder(AdminOrderRequest request, String organizerEmail) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("У вас нет прав для бронирования билетов на этот ивент");
        }

        if (event.getIsReservedSeating() != null && event.getIsReservedSeating()) {
            for (String seatId : request.getSeatIds()) {
                if (event.getSoldSeats().contains(seatId)) {
                    throw new RuntimeException("Место " + seatId + " уже занято");
                }
            }
            event.getSoldSeats().addAll(request.getSeatIds());
            if (event.getAdminSeats() == null) event.setAdminSeats(new ArrayList<>());
            event.getAdminSeats().addAll(request.getSeatIds());
        }

        event.setSold(event.getSold() + request.getSeatIds().size());
        eventRepository.save(event);

        Order order = new Order();
        order.setEventId(event.getId());

        // ВАЖНО: Заменяем фейковые данные на реальные данные менеджера
        order.setCustomerName("ADMIN BLOCK".equals(request.getCustomerName()) ? "Təşkilatçı (Blok)" : request.getCustomerName());
        order.setCustomerEmail("admin@tickit.az".equals(request.getCustomerEmail()) ? organizerEmail : request.getCustomerEmail());

        order.setCustomerPhone(request.getCustomerPhone());
        order.setSeatIds(request.getSeatIds());
        order.setTotalAmount(0.0);
        order.setOriginalAmount(0.0);
        order.setStatus("SUCCESS");
        order.setCreatedAt(LocalDateTime.now());

        List<OrderTicket> tickets = request.getSeatIds().stream().map(seatId -> {
            OrderTicket ticket = new OrderTicket();
            ticket.setTicketNumber("ADM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            ticket.setSeatId(seatId);
            ticket.setQrCode(event.getShortLink() + "-" + seatId + "-" + UUID.randomUUID().toString().substring(0, 4));
            ticket.setScanned(false);
            return ticket;
        }).collect(Collectors.toList());

        order.setTickets(tickets);

        return orderRepository.save(order);
    }

    @Transactional
    public void unbookAdminSeats(String eventId, List<String> seatIds, String organizerEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("No permission");
        }

        // Достаем все заказы один раз, чтобы не грузить базу
        List<Order> eventOrders = orderRepository.findByEventIdOrderByCreatedAtDesc(eventId);

        for (String seatId : seatIds) {
            // Ищем заказ, в котором лежит это место
            Order orderToUpdate = eventOrders.stream()
                    .filter(o -> o.getSeatIds() != null && o.getSeatIds().contains(seatId))
                    .findFirst()
                    .orElse(null);

            if (orderToUpdate != null) {
                if (orderToUpdate.getTotalAmount() != null && orderToUpdate.getTotalAmount() > 0) {
                    throw new RuntimeException("Нельзя отменить билет, купленный клиентом!");
                }

                orderToUpdate.getSeatIds().remove(seatId);

                if (orderToUpdate.getTickets() != null) {
                    orderToUpdate.getTickets().removeIf(t -> t.getSeatId() != null && t.getSeatId().equals(seatId));
                }

                // Если заказ стал пустым - СТИРАЕМ ЕГО!
                if (orderToUpdate.getSeatIds().isEmpty()) {
                    orderRepository.delete(orderToUpdate);
                    eventOrders.remove(orderToUpdate);
                } else {
                    orderRepository.save(orderToUpdate);
                }
            }

            // Освобождаем места в ивенте
            if (event.getSoldSeats() != null) event.getSoldSeats().remove(seatId);
            if (event.getAdminSeats() != null) event.getAdminSeats().remove(seatId);
            event.setSold(Math.max(0, event.getSold() - 1));
        }

        eventRepository.save(event);
    }

    @Transactional
    public void unbookAdminSeats(String eventId, String seatId, String organizerEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("No permission");
        }

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getEventId().equals(eventId) && o.getSeatIds() != null && o.getSeatIds().contains(seatId))
                .collect(Collectors.toList());

        if (orders.isEmpty()) {
            throw new RuntimeException("Бронь не найдена");
        }

        Order orderToUpdate = orders.get(0);

        if (orderToUpdate.getTotalAmount() != null && orderToUpdate.getTotalAmount() > 0) {
            throw new RuntimeException("Нельзя отменить билет, купленный клиентом!");
        }

        orderToUpdate.getSeatIds().remove(seatId);

        if (orderToUpdate.getTickets() != null) {
            orderToUpdate.getTickets().removeIf(t -> t.getSeatId() != null && t.getSeatId().equals(seatId));
        }

        if (orderToUpdate.getSeatIds().isEmpty()) {
            orderRepository.delete(orderToUpdate);
        } else {
            orderRepository.save(orderToUpdate);
        }

        // Освобождаем место
        if (event.getSoldSeats() != null) {
            event.getSoldSeats().remove(seatId);
        }

        // ВАЖНО: Удаляем из списка админских мест!
        if (event.getAdminSeats() != null) {
            event.getAdminSeats().remove(seatId);
        }

        event.setSold(Math.max(0, event.getSold() - 1));
        eventRepository.save(event);
    }

    public List<az.tickit.order.dto.OrderResponse> getAllOrganizerOrders(String organizerEmail) {
        List<Event> myEvents = eventRepository.findByOrganizerId(organizerEmail);
        List<String> eventIds = myEvents.stream().map(Event::getId).collect(Collectors.toList());

        return orderRepository.findAll().stream()
                .filter(o -> eventIds.contains(o.getEventId()))
                .map(o -> {
                    Event event = myEvents.stream()
                            .filter(e -> e.getId().equals(o.getEventId()))
                            .findFirst().orElse(null);

                    return az.tickit.order.dto.OrderResponse.builder()
                            .id(o.getId().substring(Math.max(0, o.getId().length() - 6)).toUpperCase())
                            .eventName(event != null ? event.getTitle() : "Naməlum")
                            .customer(o.getCustomerName())
                            .email(o.getCustomerEmail())
                            .type(o.getSeatIds() != null ? o.getSeatIds().size() : 1)
                            .amount(o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                            .date(o.getCreatedAt())
                            .status(o.getStatus())
                            .promoCode(o.getPromoCode())
                            .isInvite(o.getTotalAmount() == null || o.getTotalAmount() == 0)
                            .build();
                })
                .sorted(Comparator.comparing(az.tickit.order.dto.OrderResponse::getDate).reversed())
                .collect(Collectors.toList());
    }
}