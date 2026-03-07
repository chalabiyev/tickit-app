package az.eticksystem.order.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateOrderRequest {
    private String       eventId;
    private String       customerName;
    private String       customerEmail;
    private String       customerPhone;
    private List<String> seatIds;
    private Double       totalAmount;
}