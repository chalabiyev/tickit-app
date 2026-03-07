package az.eticksystem.order.dto;

import lombok.Data;
import java.util.List;

@Data
public class AdminOrderRequest {
    private String       eventId;
    private String       customerName;
    private String       customerEmail;
    private String       customerPhone;
    private List<String> seatIds;
    private Boolean      isInvite;
    private Boolean      sendEmail;
    private String       inviteNote;
}