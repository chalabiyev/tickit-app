package az.eticksystem.promocode;

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

    private String       code;
    private String       organizerId;
    private String       eventId;
    private DiscountType type;
    private double       value;
    private int          usageLimit;
    private int          usedCount;
    private LocalDateTime expiresAt;
    private boolean      active;
    private List<String> applicableTierIds;
}