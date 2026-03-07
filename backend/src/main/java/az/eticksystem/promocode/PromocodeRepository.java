package az.eticksystem.promocode;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PromocodeRepository extends MongoRepository<Promocode, String> {
    List<Promocode>     findByOrganizerId(String organizerId);
    Optional<Promocode> findByCode(String code);
}