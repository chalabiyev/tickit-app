package az.eticksystem.promocode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromocodeService {

    private final PromocodeRepository promocodeRepository;

    public Promocode createPromocode(Promocode promocode, String organizerEmail) {
        promocode.setOrganizerId(organizerEmail);
        promocode.setUsedCount(0);
        promocode.setActive(true);
        // Код всегда в верхнем регистре — чтобы validate совпадал
        if (promocode.getCode() != null) {
            promocode.setCode(promocode.getCode().toUpperCase());
        }
        Promocode saved = promocodeRepository.save(promocode);
        log.info("Promocode created: code={} by={}", saved.getCode(), organizerEmail);
        return saved;
    }

    public List<Promocode> getMyPromocodes(String organizerEmail) {
        return promocodeRepository.findByOrganizerId(organizerEmail);
    }

    public Promocode validateCode(String code, String eventId) {
        Promocode promo = promocodeRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Promo-kod tapılmadı"));

        if (!promo.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo-kod aktiv deyil");
        }

        if (promo.getExpiresAt() != null && promo.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo-kodun vaxtı bitib");
        }

        if (promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo-kodun limiti bitib");
        }

        if (promo.getEventId() != null && !promo.getEventId().equals(eventId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bu promo-kod bu tədbir üçün keçərli deyil");
        }

        log.info("Promocode validated: code={} event={}", code, eventId);
        return promo;
    }

    public void deletePromocode(String id, String organizerEmail) {
        Promocode promo = promocodeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Promo-kod tapılmadı"));

        if (!promo.getOrganizerId().equals(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Sizin bu kodu silməyə icazəniz yoxdur");
        }

        promocodeRepository.deleteById(id);
        log.info("Promocode deleted: id={} by={}", id, organizerEmail);
    }
}