package az.tickit.promocode;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromocodeService {
    private final PromocodeRepository promocodeRepository;

    public Promocode createPromocode(Promocode promocode, String organizerEmail) {
        promocode.setOrganizerId(organizerEmail);
        promocode.setUsedCount(0);
        promocode.setActive(true);
        return promocodeRepository.save(promocode);
    }

    public List<Promocode> getMyPromocodes(String organizerEmail) {
        return promocodeRepository.findByOrganizerId(organizerEmail);
    }

    public Promocode validateCode(String code, String eventId) {
        Promocode promo = promocodeRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Promo-kod tapılmadı"));

        if (!promo.isActive()) throw new RuntimeException("Promo-kod актив deyil");

        if (promo.getExpiresAt() != null && promo.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Promo-kodun vaxtı bitib");
        }

        if (promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new RuntimeException("Promo-kodun limitini bitib");
        }

        if (promo.getEventId() != null && !promo.getEventId().equals(eventId)) {
            throw new RuntimeException("Bu promo-kod bu tədbir üçün keçərli deyil");
        }

        return promo;
    }

    public void deletePromocode(String id, String organizerEmail) {
        Promocode promo = promocodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promo-kod tapılmadı"));

        if (!promo.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("Sizin bu kodu silməyə icazəniz yoxdur");
        }
        promocodeRepository.deleteById(id);
    }
}