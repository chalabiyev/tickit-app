package az.tickit.order; // Замени на свой пакет

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "orders")
public class Order {
    @Id
    private String id;
    private String eventId;          // К какому ивенту относится
    private String customerName;     // Имя покупателя
    private String customerEmail;    // Email покупателя
    private List<String> seatIds;    // Купленные места: ["A-1", "A-2"]
    private Double totalAmount;      // Общая сумма заказа (для статистики)
    private String status;           // SUCCESS, PENDING, CANCELLED
    private LocalDateTime createdAt; // Дата покупки (для графика)
}