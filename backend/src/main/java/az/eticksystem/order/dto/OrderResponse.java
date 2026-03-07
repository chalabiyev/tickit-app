package az.eticksystem.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private String        id;
    private String        eventName;
    private String        customer;
    private String        email;
    private int           type;
    private double        amount;
    private LocalDateTime date;
    private String        status;
    private String        promoCode;
    private boolean       isInvite;
}