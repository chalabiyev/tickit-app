package az.tickit.order;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {
    // Этот метод понадобится нам позже для страницы статистики!
    List<Order> findByEventIdOrderByCreatedAtDesc(String eventId);
}