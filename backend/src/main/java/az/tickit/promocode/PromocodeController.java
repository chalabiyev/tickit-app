package az.tickit.promocode;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/promocodes")
@RequiredArgsConstructor
public class PromocodeController {
    private final PromocodeRepository promocodeRepository;
    private final PromocodeService promocodeService;

    @PostMapping
    public ResponseEntity<Promocode> create(@RequestBody Promocode promocode, Authentication auth) {
        promocode.setOrganizerId(auth.getName()); // Устанавливаем email организатора
        promocode.setUsedCount(0);
        promocode.setActive(true);
        return ResponseEntity.ok(promocodeRepository.save(promocode));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Promocode>> getMyCodes(Authentication auth) {
        return ResponseEntity.ok(promocodeRepository.findByOrganizerId(auth.getName()));
    }

    @GetMapping("/validate")
    public ResponseEntity<Promocode> validate(@RequestParam String code, @RequestParam String eventId) {
        return ResponseEntity.ok(promocodeService.validateCode(code, eventId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        promocodeService.deletePromocode(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}