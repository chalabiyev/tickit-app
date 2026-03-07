package az.eticksystem.order;

import az.eticksystem.order.dto.AdminOrderRequest;
import az.eticksystem.order.dto.AdminUnbookRequest;
import az.eticksystem.order.dto.CreateOrderRequest;
import az.eticksystem.order.dto.OrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/create")
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @PostMapping("/scan/{qrCode}")
    public ResponseEntity<Map<String, Object>> scanTicket(@PathVariable String qrCode) {
        // GlobalExceptionHandler поймает ResponseStatusException — try/catch не нужен
        String result = orderService.scanTicket(qrCode);
        return ResponseEntity.ok(Map.of("success", true, "message", result));
    }

    @PostMapping("/admin-book")
    public ResponseEntity<Order> adminBook(
            @RequestBody AdminOrderRequest request,
            Authentication auth) {
        return ResponseEntity.ok(orderService.createAdminOrder(request, auth.getName()));
    }

    @PostMapping("/admin-unbook")
    public ResponseEntity<Map<String, Object>> unbookAdminSeats(
            @RequestBody AdminUnbookRequest request,
            Authentication auth) {
        orderService.unbookAdminSeats(request.getEventId(), request.getSeatIds(), auth.getName());
        return ResponseEntity.ok(Map.of("success", true, "message", "Unbooked successfully"));
    }

    @GetMapping("/organizer-all")
    public ResponseEntity<List<OrderResponse>> getAllOrganizerOrders(Authentication auth) {
        return ResponseEntity.ok(orderService.getAllOrganizerOrders(auth.getName()));
    }
}