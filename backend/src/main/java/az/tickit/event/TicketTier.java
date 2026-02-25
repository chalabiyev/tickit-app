package az.tickit.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketTier {
    private String tierId; // Убедись, что НЕТ @Id
    private String name;
    private Double price;
    private Integer quantity;
    private String color;
}