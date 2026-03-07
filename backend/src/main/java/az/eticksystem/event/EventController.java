package az.eticksystem.event;

import az.eticksystem.event.dto.CreateEventRequest;
import az.eticksystem.event.dto.EventStatsResponse;
import az.eticksystem.event.dto.GlobalStatsResponse;
import az.eticksystem.event.dto.UpdateEventRequest;
import az.eticksystem.order.Order;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<Event> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("Creating event '{}' for organizer: {}", request.getTitle(), email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.createEvent(request, email));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Event>> getMyEvents(Authentication authentication) {
        return ResponseEntity.ok(eventService.getEventsByOrganizer(authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(
            @PathVariable String id,
            @RequestBody UpdateEventRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(eventService.updateEvent(id, authentication.getName(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(
            @PathVariable String id,
            Authentication authentication) {
        eventService.deleteEvent(id, authentication.getName());
        log.info("Event {} deleted by {}", id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
    }

    @GetMapping("/s/{shortLink}")
    public ResponseEntity<Event> getPublicEvent(@PathVariable String shortLink) {
        return ResponseEntity.ok(eventService.getEventByShortLink(shortLink));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable String id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<EventStatsResponse> getEventStatistics(
            @PathVariable String id,
            Authentication authentication) {
        return ResponseEntity.ok(eventService.getEventStatistics(id, authentication.getName()));
    }

    @GetMapping("/{eventId}/all-orders")
    public ResponseEntity<List<Order>> getAllOrders(
            @PathVariable String eventId,
            Authentication authentication) {
        return ResponseEntity.ok(eventService.getAllEventOrders(eventId, authentication.getName()));
    }

    @GetMapping("/stats/global")
    public ResponseEntity<GlobalStatsResponse> getGlobalStats(Authentication authentication) {
        return ResponseEntity.ok(eventService.getGlobalStatistics(authentication.getName()));
    }
}