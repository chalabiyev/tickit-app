package az.tickit.event;

import az.tickit.event.dto.CreateEventRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List; // <-- не забудь импорт
import java.util.Map;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<Event> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication) {

        String organizerEmail = authentication.getName();
        Event createdEvent = eventService.createEvent(request, organizerEmail);
        return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
    }

    // --- НОВЫЙ ЭНДПОИНТ ---
    @GetMapping("/me")
    public ResponseEntity<List<Event>> getMyEvents(Authentication authentication) {
        // Достаем email из токена
        String organizerEmail = authentication.getName();

        // Ищем ивенты в базе
        List<Event> myEvents = eventService.getEventsByOrganizer(organizerEmail);

        // Возвращаем список (Spring сам превратит его в массив JSON)
        return ResponseEntity.ok(myEvents);
    }

    // --- НОВЫЙ ЭНДПОИНТ ДЛЯ РЕДАКТИРОВАНИЯ ---
    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(
            @PathVariable String id,
            @RequestBody az.tickit.event.dto.UpdateEventRequest request,
            Authentication authentication) {

        // Достаем email того, кто сейчас залогинен
        String organizerEmail = authentication.getName();

        // Обновляем
        Event updatedEvent = eventService.updateEvent(id, organizerEmail, request);

        return ResponseEntity.ok(updatedEvent);
    }

    // --- НОВЫЙ ЭНДПОИНТ ДЛЯ УДАЛЕНИЯ ---
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(
            @PathVariable String id,
            Authentication authentication) {

        String organizerEmail = authentication.getName();
        eventService.deleteEvent(id, organizerEmail);

        // Возвращаем успешный ответ в формате JSON
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
    }

    // --- ПУБЛИЧНЫЙ ЭНДПОИНТ (Без токена) ---
    @GetMapping("/s/{shortLink}")
    public ResponseEntity<Event> getPublicEvent(@PathVariable String shortLink) {
        Event event = eventService.getEventByShortLink(shortLink);
        return ResponseEntity.ok(event);
    }
}