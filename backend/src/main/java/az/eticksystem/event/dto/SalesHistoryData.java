package az.eticksystem.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SalesHistoryData {
    private String date;
    private double amount;
}