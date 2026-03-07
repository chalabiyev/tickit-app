package az.eticksystem.event.dto;

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
    private double              totalRevenue;
    private int                 totalSold;
    private int                 totalViews;
    private int                 activeEvents;
    private List<SalesHistoryData> salesHistory;
}