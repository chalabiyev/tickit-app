package az.tickit.order.dto;

import lombok.Data;

import java.util.List;

@Data
public class AdminUnbookRequest {
    private String eventId;
    private List<String> seatIds;
}