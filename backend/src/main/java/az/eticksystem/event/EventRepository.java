package az.eticksystem.event;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {

    Optional<Event> findByShortLink(String shortLink);

    // Только не удалённые — для показа организатору
    List<Event> findByOrganizerIdAndDeletedFalse(String organizerId);

    // Все (включая удалённые) — для внутренних нужд/отчётов
    List<Event> findByOrganizerId(String organizerId);
}