// SalesHistoryData.java
package az.tickit.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SalesHistoryData {
    private String date; // Например, "02.03"
    private double amount;
}