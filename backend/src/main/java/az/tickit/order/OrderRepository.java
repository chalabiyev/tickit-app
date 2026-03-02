package az.tickit.order;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {
    // Этот метод понадобится нам позже для страницы статистики!
    List<Order> findByEventIdOrderByCreatedAtDesc(String eventId);

    Optional<Order> findByTickets_QrCode(String qrCode);
    List<Order> findByEventId(String eventId);

    // Найти все заказы по email покупателя и ID ивента
    List<Order> findByCustomerEmailAndEventId(String customerEmail, String eventId);
}