package az.eticksystem.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketTier {
    private String  tierId;
    private String  name;
    private Double  price;
    private Integer quantity;
    private String  color;
    private Integer bgScale;
    private Integer bgOffsetX;
    private Integer bgOffsetY;
    private Integer width;
    private Integer height;
    private String  src;
}