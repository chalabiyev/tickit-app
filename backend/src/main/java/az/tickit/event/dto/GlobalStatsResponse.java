package az.tickit.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalStatsResponse {
    private double totalRevenue;   // Общая выручка (₼)
    private int totalSold;        // Всего продано билетов
    private int totalViews;       // Общие просмотры страниц ивентов
    private int activeEvents;     // Количество ивентов со статусом PUBLISHED
    private List<SalesHistoryData> salesHistory; // Данные для графика
}