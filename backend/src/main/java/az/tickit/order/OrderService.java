package az.tickit.order;

import az.tickit.event.Event;
import az.tickit.event.EventRepository;
import az.tickit.order.dto.CreateOrderRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final EventRepository eventRepository;

    public Order createOrder(CreateOrderRequest request) {
        // 1. Находим ивент
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // 2. Инициализируем список, если он пустой (защита от NullPointerException)
        if (event.getSoldSeats() == null) {
            event.setSoldSeats(new ArrayList<>());
        }

        // 3. ПРОВЕРКА: Не проданы ли уже эти места?
        for (String seatId : request.getSeatIds()) {
            if (event.getSoldSeats().contains(seatId)) {
                throw new RuntimeException("Oturacaq artıq satılıb: " + seatId); // Место уже продано
            }
        }

        // 4. Создаем заказ
        Order order = new Order();
        order.setEventId(event.getId());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setSeatIds(request.getSeatIds());
        order.setTotalAmount(request.getTotalAmount());
        order.setStatus("SUCCESS");
        order.setCreatedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);

        // 5. Обновляем ивент (добавляем места в список проданных и увеличиваем счетчик)
        event.getSoldSeats().addAll(request.getSeatIds());
        int currentSold = (event.getSold() == null) ? 0 : event.getSold();
        event.setSold(currentSold + request.getSeatIds().size());

        eventRepository.save(event);

        return savedOrder;
    }
}