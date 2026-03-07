package az.eticksystem.order;

import lombok.Data;

@Data
public class OrderTicket {
    private String  seatId;
    private String  qrCode;
    private String  ticketNumber;
    private boolean scanned; // единственное поле — без дублирования isScanned/used
}