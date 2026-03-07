package az.eticksystem.order;

import az.eticksystem.event.Event;
import az.eticksystem.event.EventRepository;
import az.eticksystem.order.dto.AdminOrderRequest;
import az.eticksystem.order.dto.CreateOrderRequest;
import az.eticksystem.order.dto.OrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Set<String> SUCCESS_STATUSES = Set.of("SUCCESS", "Ödənilib");

    private final OrderRepository orderRepository;
    private final EventRepository eventRepository;

    // ── Public order ──────────────────────────────────────────────────────

    public Order createOrder(CreateOrderRequest request) {
        Event event = findEventOrThrow(request.getEventId());

        if ("PAUSED".equalsIgnoreCase(event.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bu tədbir üçün bilet satışı müvəqqəti dayandırılıb!");
        }

        int maxTickets = (event.getMaxTicketsPerOrder() != null && event.getMaxTicketsPerOrder() > 0)
                ? event.getMaxTicketsPerOrder() : 10;
        int requested = request.getSeatIds().size();

        int alreadyBought = orderRepository
                .findByCustomerEmailAndEventId(request.getCustomerEmail(), event.getId())
                .stream()
                .filter(o -> SUCCESS_STATUSES.contains(o.getStatus()))
                .mapToInt(o -> o.getSeatIds() != null ? o.getSeatIds().size() : 0)
                .sum();

        if (alreadyBought + requested > maxTickets) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Limit aşıldı! Maksimum " + maxTickets + " bilet. Artıq " + alreadyBought + " bilet almısınız.");
        }

        if (event.getSoldSeats() == null) event.setSoldSeats(new ArrayList<>());

        for (String seatId : request.getSeatIds()) {
            if (event.getSoldSeats().contains(seatId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Oturacaq artıq satılıb: " + seatId);
            }
        }

        List<OrderTicket> tickets = request.getSeatIds().stream().map(seatId -> {
            OrderTicket t = new OrderTicket();
            t.setSeatId(seatId);
            t.setQrCode(UUID.randomUUID().toString());
            t.setScanned(false);
            return t;
        }).collect(Collectors.toList());

        Order order = Order.builder()
                .eventId(event.getId())
                .customerName(request.getCustomerName())
                .customerEmail(request.getCustomerEmail())
                .customerPhone(request.getCustomerPhone())
                .seatIds(new ArrayList<>(request.getSeatIds()))
                .totalAmount(request.getTotalAmount())
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .tickets(tickets)
                .build();

        Order saved = orderRepository.save(order);

        event.getSoldSeats().addAll(request.getSeatIds());
        event.setSold((event.getSold() == null ? 0 : event.getSold()) + request.getSeatIds().size());
        eventRepository.save(event);

        log.info("Order created: id={} event={} tickets={}", saved.getId(), event.getId(), requested);
        return saved;
    }

    // ── Scan ──────────────────────────────────────────────────────────────

    public String scanTicket(String qrCode) {
        Order order = orderRepository.findByTickets_QrCode(qrCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Bilet tapılmadı və ya saxtadır!"));

        OrderTicket ticket = order.getTickets().stream()
                .filter(t -> t.getQrCode().equals(qrCode))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bilet tapılmadı!"));

        if (ticket.isScanned()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "DİQQƏT: Bu bilet artıq istifadə olunub!");
        }

        ticket.setScanned(true);
        orderRepository.save(order);
        log.info("Ticket scanned: qr={} seat={}", qrCode, ticket.getSeatId());
        return "Uğurlu! Girişə icazə verildi. (Yer: " + ticket.getSeatId() + ")";
    }

    // ── Admin booking ─────────────────────────────────────────────────────

    public Order createAdminOrder(AdminOrderRequest request, String organizerEmail) {
        Event event = findEventOrThrow(request.getEventId());
        checkOwnership(event, organizerEmail);

        if (Boolean.TRUE.equals(event.getIsReservedSeating())) {
            if (event.getSoldSeats() == null) event.setSoldSeats(new ArrayList<>());
            for (String seatId : request.getSeatIds()) {
                if (event.getSoldSeats().contains(seatId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Oturacaq artıq tutulub: " + seatId);
                }
            }
            event.getSoldSeats().addAll(request.getSeatIds());
            if (event.getAdminSeats() == null) event.setAdminSeats(new ArrayList<>());
            event.getAdminSeats().addAll(request.getSeatIds());
        }

        event.setSold((event.getSold() == null ? 0 : event.getSold()) + request.getSeatIds().size());
        eventRepository.save(event);

        // Используем email организатора вместо захардкоженного admin@tickit.az
        String customerEmail = "admin@tickit.az".equals(request.getCustomerEmail())
                ? organizerEmail : request.getCustomerEmail();
        String customerName  = "ADMIN BLOCK".equals(request.getCustomerName())
                ? "Təşkilatçı (Blok)" : request.getCustomerName();

        List<OrderTicket> tickets = request.getSeatIds().stream().map(seatId -> {
            OrderTicket t = new OrderTicket();
            t.setTicketNumber("ADM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            t.setSeatId(seatId);
            t.setQrCode(event.getShortLink() + "-" + seatId + "-" + UUID.randomUUID().toString().substring(0, 4));
            t.setScanned(false);
            return t;
        }).collect(Collectors.toList());

        Order order = Order.builder()
                .eventId(event.getId())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(request.getCustomerPhone())
                .seatIds(new ArrayList<>(request.getSeatIds()))
                .totalAmount(0.0)
                .originalAmount(0.0)
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .tickets(tickets)
                .build();

        Order saved = orderRepository.save(order);
        log.info("Admin order created: event={} seats={} by={}", event.getId(), request.getSeatIds(), organizerEmail);
        return saved;
    }

    // ── Admin unbook ──────────────────────────────────────────────────────

    @Transactional
    public void unbookAdminSeats(String eventId, List<String> seatIds, String organizerEmail) {
        Event event = findEventOrThrow(eventId);
        checkOwnership(event, organizerEmail);

        // Берём заказы по eventId — без findAll()
        List<Order> eventOrders = orderRepository.findByEventIdOrderByCreatedAtDesc(eventId);

        for (String seatId : seatIds) {
            Order orderToUpdate = eventOrders.stream()
                    .filter(o -> o.getSeatIds() != null && o.getSeatIds().contains(seatId))
                    .findFirst()
                    .orElse(null);

            if (orderToUpdate != null) {
                if (orderToUpdate.getTotalAmount() != null && orderToUpdate.getTotalAmount() > 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Müştəri tərəfindən alınmış bileti ləğv etmək olmaz!");
                }

                orderToUpdate.getSeatIds().remove(seatId);
                if (orderToUpdate.getTickets() != null) {
                    orderToUpdate.getTickets().removeIf(t -> seatId.equals(t.getSeatId()));
                }

                if (orderToUpdate.getSeatIds().isEmpty()) {
                    orderRepository.delete(orderToUpdate);
                    eventOrders.remove(orderToUpdate);
                } else {
                    orderRepository.save(orderToUpdate);
                }
            }

            if (event.getSoldSeats()  != null) event.getSoldSeats().remove(seatId);
            if (event.getAdminSeats() != null) event.getAdminSeats().remove(seatId);
            event.setSold(Math.max(0, (event.getSold() == null ? 0 : event.getSold()) - 1));
        }

        eventRepository.save(event);
        log.info("Admin seats unbooked: event={} seats={} by={}", eventId, seatIds, organizerEmail);
    }

    // ── Organizer orders list ─────────────────────────────────────────────

    public List<OrderResponse> getAllOrganizerOrders(String organizerEmail) {
        List<Event> myEvents = eventRepository.findByOrganizerId(organizerEmail);
        List<String> eventIds = myEvents.stream().map(Event::getId).collect(Collectors.toList());

        // findByEventIdIn вместо findAll() + filter в памяти
        Map<String, String> eventNames = myEvents.stream()
                .collect(Collectors.toMap(Event::getId, Event::getTitle));

        return orderRepository.findByEventIdIn(eventIds).stream()
                .map(o -> OrderResponse.builder()
                        .id(o.getId().substring(Math.max(0, o.getId().length() - 6)).toUpperCase())
                        .eventName(eventNames.getOrDefault(o.getEventId(), "Naməlum"))
                        .customer(o.getCustomerName())
                        .email(o.getCustomerEmail())
                        .type(o.getSeatIds() != null ? o.getSeatIds().size() : 1)
                        .amount(o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                        .date(o.getCreatedAt())
                        .status(o.getStatus())
                        .promoCode(o.getPromoCode())
                        .isInvite(o.getTotalAmount() == null || o.getTotalAmount() == 0)
                        .build())
                .sorted(Comparator.comparing(OrderResponse::getDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private Event findEventOrThrow(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    private void checkOwnership(Event event, String organizerEmail) {
        if (!event.getOrganizerId().equals(organizerEmail)) {
            log.warn("Unauthorized order action: event={} by={}", event.getId(), organizerEmail);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }
}