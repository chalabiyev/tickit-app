package az.tickit.event;

import az.tickit.event.dto.CreateEventRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public Event createEvent(CreateEventRequest request, String organizerEmail) {

        // 1. БЕЗОПАСНОСТЬ: Сами считаем вместимость
        int totalCapacity = request.getTiers().stream()
                .mapToInt(CreateEventRequest.TicketTierDto::getQuantity)
                .sum();

        // 2. БЕЗОПАСНОСТЬ: Сами считаем комиссию
        BigDecimal platformFee = calculatePlatformFee(totalCapacity);

        // 3. Генерация короткой ссылки
        String shortLink = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        // 4. Маппинг билетов (ИСПРАВЛЕННЫЙ!)
        List<TicketTier> tiers = request.getTiers().stream()
                .map(dto -> TicketTier.builder()
                        // Берем tierId от фронтенда! Если его нет, берем id
                        .tierId(dto.getTierId() != null ? dto.getTierId() : dto.getId())
                        .name(dto.getName())
                        // Исправляем BigDecimal -> Double
                        .price(dto.getPrice() != null ? dto.getPrice().doubleValue() : 0.0)
                        .quantity(dto.getQuantity())
                        .color(dto.getColor())
                        .build())
                .collect(Collectors.toList());

        // 5. Маппинг мест
        List<Seat> seats = null;
        if (Boolean.TRUE.equals(request.getIsReservedSeating()) && request.getSeats() != null) {
            seats = request.getSeats().stream()
                    .map(dto -> Seat.builder()
                            .row(dto.getRow())
                            .col(dto.getCol())
                            .tierId(dto.getTierId()) // Связь с фронтенд-ID
                            .build())
                    .collect(Collectors.toList());
        }

        // 6. Сборка ивента
        Event event = Event.builder()
                .organizerId(organizerEmail)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .ageRestriction(request.getAgeRestriction())
                .eventDate(request.getEventDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isPhysical(request.getIsPhysical())
                .venueName(request.getVenueName())
                .address(request.getAddress())
                .isPrivate(request.getIsPrivate())
                .coverImageUrl(request.getCoverImageUrl())
                .isReservedSeating(request.getIsReservedSeating())
                .tiers(tiers)
                .seats(seats == null ? List.of() : seats)
                // СОХРАНЯЕМ КОНФИГ КАРТЫ СЦЕНЫ И РЯДОВ!
                .seatMapConfig(request.getSeatMapConfig())
                .ticketDesign(request.getTicketDesign())
                .totalCapacity(totalCapacity)
                .platformFee(platformFee)
                .shortLink(shortLink)
                .status("PUBLISHED")
                .build();

        return eventRepository.save(event);
    }

    // НОВЫЙ МЕТОД: Обновление ивента
    public Event updateEvent(String eventId, String organizerEmail, az.tickit.event.dto.UpdateEventRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("You don't have permission to edit this event");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            event.setTitle(request.getTitle());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            event.setDescription(request.getDescription());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            event.setCategory(request.getCategory());
        }
        if (request.getAddress() != null && !request.getAddress().isBlank()) {
            event.setAddress(request.getAddress());
            event.setVenueName(request.getAddress());
        }
        if (request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank()) {
            event.setCoverImageUrl(request.getCoverImageUrl());
        }

        return eventRepository.save(event);
    }

    public List<Event> getEventsByOrganizer(String organizerEmail) {
        return eventRepository.findByOrganizerIdAndDeletedFalse(organizerEmail);
    }

    public void deleteEvent(String eventId, String organizerEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("You don't have permission to delete this event");
        }

        event.setDeleted(true);
        eventRepository.save(event);
    }

    public Event getEventByShortLink(String shortLink) {
        return eventRepository.findByShortLink(shortLink)
                .filter(event -> !event.isDeleted())
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    private BigDecimal calculatePlatformFee(int capacity) {
        if (capacity <= 10) return BigDecimal.ZERO;
        if (capacity <= 50) return new BigDecimal("5.00");
        if (capacity <= 100) return new BigDecimal("10.00");
        return new BigDecimal("15.00");
    }
}