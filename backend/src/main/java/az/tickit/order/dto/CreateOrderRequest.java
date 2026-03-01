package az.tickit.order.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateOrderRequest {
    private String eventId;
    private String customerName;
    private String customerEmail;
    private List<String> seatIds;
    private Double totalAmount;
    private String customerPhone;
}