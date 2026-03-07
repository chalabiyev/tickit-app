package az.eticksystem.event.dto;

import lombok.Data;

import java.util.List;

@Data
public class EventStatsResponse {
    private double revenue;
    private int    sold;
    private int    total;
    private int    views;
    private double conversionRate;
    private List<OrderSummary>    recentOrders;
    private List<SalesHistoryData> salesHistory;
    private List<String>           adminSeats;

    @Data
    public static class OrderSummary {
        private String id;
        private String customer;
        private String email;
        private String customerPhone;
        private String type;
        private double amount;
        private Double originalAmount;
        private String promoCode;
        private String date;
        private String status;
    }
}