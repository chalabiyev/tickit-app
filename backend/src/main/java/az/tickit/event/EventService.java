package az.tickit.event;

import az.tickit.event.dto.CreateEventRequest;
import az.tickit.order.Order;
import az.tickit.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final OrderRepository orderRepository;

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
                .seatMapConfig(request.getSeatMapConfig())
                .ticketDesign(request.getTicketDesign())
                .buyerQuestions(request.getBuyerQuestions()) // <--- ДОБАВЛЕНО СЮДА
                .totalCapacity(totalCapacity)
                .platformFee(platformFee)
                .shortLink(shortLink)
                .status("PUBLISHED")
                .build();

        return eventRepository.save(event);
    }

    public Event updateEvent(String eventId, String organizerEmail, az.tickit.event.dto.UpdateEventRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Проверка, что ивент принадлежит этому организатору
        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("You don't have permission to edit this event");
        }

        // Обновляем основные данные
        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getCategory() != null) event.setCategory(request.getCategory());

        // Обновляем дату и время
        if (request.getEventDate() != null) event.setEventDate(request.getEventDate());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());

        // Обновляем локацию
        if (request.getIsPhysical() != null) event.setIsPhysical(request.getIsPhysical());
        if (request.getVenueName() != null) event.setVenueName(request.getVenueName());
        if (request.getAddress() != null) event.setAddress(request.getAddress());

        // Обновляем настройки приватности и ограничений
        if (request.getIsPrivate() != null) event.setIsPrivate(request.getIsPrivate());
        if (request.getAgeRestriction() != null) event.setAgeRestriction(request.getAgeRestriction());
        if (request.getMaxTicketsPerOrder() != null) event.setMaxTicketsPerOrder(request.getMaxTicketsPerOrder());

        // Обновляем картинку
        if (request.getCoverImageUrl() != null) event.setCoverImageUrl(request.getCoverImageUrl());

        return eventRepository.save(event);
    }

    public az.tickit.event.dto.EventStatsResponse getEventStatistics(String eventId, String organizerEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("Access denied");
        }

        // Достаем все заказы этого ивента (отсортированные от новых к старым)
        List<Order> orders = orderRepository.findByEventIdOrderByCreatedAtDesc(eventId);

        // Считаем общую выручку
        double totalRevenue = orders.stream()
                .filter(o -> "SUCCESS".equals(o.getStatus()))
                .mapToDouble(Order::getTotalAmount)
                .sum();

        // Упаковываем последние 5 заказов для таблицы
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy, HH:mm");
        List<az.tickit.event.dto.EventStatsResponse.OrderSummary> recentOrders = orders.stream()
                .limit(5)
                .map(o -> {
                    az.tickit.event.dto.EventStatsResponse.OrderSummary summary = new az.tickit.event.dto.EventStatsResponse.OrderSummary();
                    summary.setId(o.getId().substring(o.getId().length() - 6).toUpperCase()); // Короткий ID (последние 6 символов)
                    summary.setCustomer(o.getCustomerName());
                    summary.setEmail(o.getCustomerEmail());
                    summary.setType(o.getSeatIds().size() + " bilet"); // Пишем количество билетов
                    summary.setAmount(o.getTotalAmount());
                    summary.setDate(o.getCreatedAt().format(formatter));
                    summary.setStatus("success");
                    return summary;
                })
                .collect(Collectors.toList());

        az.tickit.event.dto.EventStatsResponse response = new az.tickit.event.dto.EventStatsResponse();
        response.setRevenue(totalRevenue);
        response.setSold(event.getSold() != null ? event.getSold() : 0);
        response.setTotal(event.getTotalCapacity() != null ? event.getTotalCapacity() : 0);
        response.setViews(1420); // Пока заглушка
        response.setConversionRate(12.5); // Пока заглушка
        response.setRecentOrders(recentOrders);

        return response;
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

    public Event getEventById(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
    }
}