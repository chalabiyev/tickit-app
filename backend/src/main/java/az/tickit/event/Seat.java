package az.tickit.event; // твой пакет

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Seat {
    private int row;
    private int col;
    private String tierId;
}