package az.tickit.event.dto;

import lombok.Data;
import java.util.List;

@Data
public class EventStatsResponse {
    private double revenue;
    private int sold;
    private int total;
    private int views;          // Реальные просмотры
    private double conversionRate; // Реальная конверсия
    private List<OrderSummary> recentOrders;
    private List<SalesHistoryData> salesHistory; // Добавь это поле в класс

    private List<String> adminSeats;

    @Data
    public static class OrderSummary {
        private String id;
        private String customer;
        private String email;
        private String customerPhone; // <-- ВОТ НАШ НОМЕР ТЕЛЕФОНА
        private String type;
        private double amount;         // Финальная цена
        private Double originalAmount; // Изначальная цена (НОВОЕ)
        private String promoCode;      // Какой код применен (НОВОЕ)
        private String date;
        private String status;
    }
}