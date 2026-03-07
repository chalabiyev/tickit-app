package az.eticksystem.order;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {

    List<Order>     findByEventIdOrderByCreatedAtDesc(String eventId);
    List<Order>     findByEventId(String eventId);
    Optional<Order> findByTickets_QrCode(String qrCode);
    List<Order>     findByCustomerEmailAndEventId(String customerEmail, String eventId);

    // Заменяет findAll() + filter в памяти — запрос идёт в MongoDB
    List<Order>     findByEventIdAndSeatIdsContaining(String eventId, String seatId);

    // Для страницы заказов организатора — по списку eventId
    List<Order>     findByEventIdIn(List<String> eventIds);
}