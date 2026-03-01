package az.tickit.order;
import lombok.Data;

@Data
public class OrderTicket {
    private String seatId;      // Например: "1_2" (ряд_место) или "GA_tier-1_..." (без мест)
    private String qrCode;      // Тот самый уникальный UUID
    private boolean isScanned;  // Статус для сканера
}
