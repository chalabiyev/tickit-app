package az.tickit.event;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {
    Optional<Event> findByShortLink(String shortLink);

    // БЫЛО: List<Event> findByOrganizerId(String organizerId);
    // СТАЛО: Ищем только те, которые НЕ удалены
    List<Event> findByOrganizerIdAndDeletedFalse(String organizerId);
}