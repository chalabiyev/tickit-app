package az.eticksystem.order;

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
@Document(collection = "orders")
public class Order {

    @Id
    private String id;

    private String          eventId;
    private String          customerName;
    private String          customerEmail;
    private String          customerPhone;
    private List<String>    seatIds;
    private Double          totalAmount;
    private Double          originalAmount;
    private String          promoCode;
    private String          status;
    private LocalDateTime   createdAt;
    private List<OrderTicket> tickets;
}