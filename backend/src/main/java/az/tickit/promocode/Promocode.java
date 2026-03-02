package az.tickit.promocode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "promocodes")
public class Promocode {
    @Id
    private String id;
    private String code; // Сам текст: "JAZZ2026"
    private String organizerId; // Кто создал (email)
    private String eventId; // К какому ивенту (null, если на все)

    private DiscountType type; // PERCENTAGE или FIXED
    private double value; // 20 (если %) или 10 (если AZN)

    private int usageLimit; // Сколько всего можно использовать
    private int usedCount; // Сколько уже использовали

    private LocalDateTime expiresAt;
    private boolean active;

    private List<String> applicableTierIds; // Список ID категорий билетов (например: ["VIP_123", "STD_456"])
}