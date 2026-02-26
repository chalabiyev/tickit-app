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
    private Integer bgScale; // Масштаб фона (в процентах, например 100)
    private Integer bgOffsetX; // Сдвиг фона X
    private Integer bgOffsetY; // Сдвиг фона Y
    private Integer width; // Ширина (для логотипов и QR)
    private Integer height; // Высота (для логотипов)
    private String src; // Ссылка на картинку (если это логотип)
}