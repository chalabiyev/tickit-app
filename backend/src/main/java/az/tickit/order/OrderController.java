package az.tickit.order;

import az.tickit.order.dto.AdminOrderRequest;
import az.tickit.order.dto.CreateOrderRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/create")
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(request);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/scan/{qrCode}")
    public ResponseEntity<?> scanTicket(@PathVariable String qrCode) {
        try {
            String result = orderService.scanTicket(qrCode);
            return ResponseEntity.ok().body(java.util.Map.of("success", true, "message", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }
    // Добавь этот метод в OrderController
    @PostMapping("/admin-book")
    public ResponseEntity<Order> adminBook(@RequestBody AdminOrderRequest request, Authentication auth) {
        // Передаем email организатора из токена для проверки прав
        return ResponseEntity.ok(orderService.createAdminOrder(request, auth.getName()));
    }
}