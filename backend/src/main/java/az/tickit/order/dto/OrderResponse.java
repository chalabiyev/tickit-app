package az.tickit.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private String id;
    private String eventName;    // Название мероприятия
    private String customer;     // Имя клиента
    private String email;        // Email клиента
    private int type;            // Количество билетов
    private double amount;       // Сумма
    private LocalDateTime date;  // Дата заказа
    private String status;       // Статус (SUCCESS и т.д.)
    private String promoCode;    // Использованный промокод
    private boolean isInvite;    // Флаг: это пригласительный/блок или нет
}