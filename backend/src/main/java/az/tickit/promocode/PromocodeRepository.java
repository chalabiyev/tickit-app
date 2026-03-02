package az.tickit.promocode;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional; // ОБЯЗАТЕЛЬНО ДОБАВЬ ЭТОТ ИМПОРТ

public interface PromocodeRepository extends MongoRepository<Promocode, String> {
    List<Promocode> findByOrganizerId(String organizerId);

    // ВОТ ЭТА СТРОКА РЕШИТ ОШИБКУ ИЗ СКРИНШОТА:
    Optional<Promocode> findByCode(String code);
}