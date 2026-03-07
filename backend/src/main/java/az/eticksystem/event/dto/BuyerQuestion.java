package az.eticksystem.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuyerQuestion {
    private String  id;
    private String  label;
    private boolean required;
}