package az.tickit.order;

import az.tickit.event.Event;
import az.tickit.event.EventRepository;
import az.tickit.order.dto.CreateOrderRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

        // 3. ГЛОБАЛЬНЫЙ ЛИМИТ БИЛЕТОВ НА EMAIL (Защита от спекулянтов)
        int maxTickets = (event.getMaxTicketsPerOrder() != null && event.getMaxTicketsPerOrder() > 0)
                ? event.getMaxTicketsPerOrder() : 10; // Если лимит не указан, ставим 10
        int requestedTickets = request.getSeatIds().size();

        // Ищем прошлые успешные заказы этого покупателя
        List<Order> existingOrders = orderRepository.findByCustomerEmailAndEventId(request.getCustomerEmail(), event.getId());
        int alreadyBought = 0;

        for (Order pastOrder : existingOrders) {
            if ("SUCCESS".equalsIgnoreCase(pastOrder.getStatus()) || "Ödənilib".equalsIgnoreCase(pastOrder.getStatus())) {
                alreadyBought += (pastOrder.getSeatIds() != null) ? pastOrder.getSeatIds().size() : 0;
            }
        }

        // Проверяем, не превысит ли покупка лимит
        if (alreadyBought + requestedTickets > maxTickets) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Limit aşıldı! Siz bu tədbir üçün maksimum " + maxTickets +
                    " bilet ala bilərsiniz. Siz artıq " + alreadyBought + " bilet almısınız.");
        }

        // 4. Инициализируем список, если он пустой (защита от NullPointerException)
        if (event.getSoldSeats() == null) {
            event.setSoldSeats(new ArrayList<>());
        }

        // 5. ПРОВЕРКА: Не проданы ли уже эти места?
        for (String seatId : request.getSeatIds()) {
            if (event.getSoldSeats().contains(seatId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Oturacaq artıq satılıb: " + seatId); // Место уже продано
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

        // --- МАГИЯ QR-КОДОВ (Начало) ---
        // Для каждого купленного места создаем отдельный билет со своим уникальным UUID
        List<OrderTicket> generatedTickets = request.getSeatIds().stream().map(seatId -> {
            OrderTicket ticket = new OrderTicket();
            ticket.setSeatId(seatId);
            ticket.setQrCode(UUID.randomUUID().toString()); // Тот самый неподбираемый QR-код
            ticket.setScanned(false); // При покупке билет еще не отсканирован
            return ticket;
        }).collect(Collectors.toList());

        order.setTickets(generatedTickets);
        // --- МАГИЯ QR-КОДОВ (Конец) ---

        Order savedOrder = orderRepository.save(order);

        // 7. Обновляем ивент (добавляем места в список проданных и увеличиваем счетчик)
        event.getSoldSeats().addAll(request.getSeatIds());
        int currentSold = (event.getSold() == null) ? 0 : event.getSold();
        event.setSold(currentSold + request.getSeatIds().size());

        eventRepository.save(event);

        return savedOrder;
    }

    public String scanTicket(String qrCode) {
        // 1. Ищем заказ, в котором есть этот QR-код
        Order order = orderRepository.findByTickets_QrCode(qrCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bilet tapılmadı və ya saxtadır!")); // Билет не найден

        // 2. Достаем конкретный билет из списка
        OrderTicket matchedTicket = order.getTickets().stream()
                .filter(t -> t.getQrCode().equals(qrCode))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bilet tapılmadı!"));

        // 3. Проверяем, не сканировали ли его раньше
        if (matchedTicket.isScanned()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DİQQƏT: Bu bilet artıq istifadə olunub!"); // Билет уже использован!
        }

        // 4. Помечаем как отсканированный и сохраняем
        matchedTicket.setScanned(true);
        orderRepository.save(order);

        return "Uğurlu! Girişə icazə verildi. (Yer: " + matchedTicket.getSeatId() + ")";
    }
}