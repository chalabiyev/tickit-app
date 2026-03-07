package az.eticksystem.promocode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/promocodes")
@RequiredArgsConstructor
public class PromocodeController {

    private final PromocodeService promocodeService;
    // Репозиторий убран из контроллера — только через сервис

    @PostMapping
    public ResponseEntity<Promocode> create(
            @RequestBody Promocode promocode,
            Authentication auth) {
        return ResponseEntity.ok(promocodeService.createPromocode(promocode, auth.getName()));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Promocode>> getMyCodes(Authentication auth) {
        return ResponseEntity.ok(promocodeService.getMyPromocodes(auth.getName()));
    }

    @GetMapping("/validate")
    public ResponseEntity<Promocode> validate(
            @RequestParam String code,
            @RequestParam String eventId) {
        return ResponseEntity.ok(promocodeService.validateCode(code, eventId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            Authentication auth) {
        promocodeService.deletePromocode(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}