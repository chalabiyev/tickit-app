package az.tickit.event.dto;

import lombok.Data;
import java.util.List;

@Data
public class EventStatsResponse {
    private double revenue;
    private int sold;
    private int total;
    private int views;
    private double conversionRate;
    private List<OrderSummary> recentOrders;

    @Data
    public static class OrderSummary {
        private String id;
        private String customer;
        private String email;
        private String type;
        private double amount;
        private String date;
        private String status;
    }
}