package az.tickit.event;

import az.tickit.event.dto.CreateEventRequest;
import az.tickit.order.Order;
import az.tickit.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final OrderRepository orderRepository;

    public Event createEvent(CreateEventRequest request, String organizerEmail) {
        int totalCapacity = request.getTiers().stream()
                .mapToInt(CreateEventRequest.TicketTierDto::getQuantity)
                .sum();

        BigDecimal platformFee = calculatePlatformFee(totalCapacity);
        String shortLink = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        List<TicketTier> tiers = request.getTiers().stream()
                .map(dto -> TicketTier.builder()
                        .tierId(dto.getTierId() != null ? dto.getTierId() : dto.getId())
                        .name(dto.getName())
                        .price(dto.getPrice() != null ? dto.getPrice().doubleValue() : 0.0)
                        .quantity(dto.getQuantity())
                        .color(dto.getColor())
                        .build())
                .collect(Collectors.toList());

        List<Seat> seats = null;
        if (Boolean.TRUE.equals(request.getIsReservedSeating()) && request.getSeats() != null) {
            seats = request.getSeats().stream()
                    .map(dto -> Seat.builder()
                            .row(dto.getRow())
                            .col(dto.getCol())
                            .tierId(dto.getTierId())
                            .build())
                    .collect(Collectors.toList());
        }

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
                .buyerQuestions(request.getBuyerQuestions())
                .totalCapacity(totalCapacity)
                .platformFee(platformFee)
                .shortLink(shortLink)
                .status("PUBLISHED")
                .deleted(false) // <--- ОБЯЗАТЕЛЬНО ДОБАВЬ ЭТО СЮДА!
                .views(0)
                .build();

        event.setStreamUrl(request.getStreamUrl());
        event.setStreamPassword(request.getStreamPassword());

        return eventRepository.save(event);
    }

    public Event updateEvent(String eventId, String organizerEmail, az.tickit.event.dto.UpdateEventRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("You don't have permission to edit this event");
        }

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getCategory() != null) event.setCategory(request.getCategory());
        if (request.getEventDate() != null) event.setEventDate(request.getEventDate());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if (request.getIsPhysical() != null) event.setIsPhysical(request.getIsPhysical());
        if (request.getVenueName() != null) event.setVenueName(request.getVenueName());
        if (request.getAddress() != null) event.setAddress(request.getAddress());
        if (request.getIsPrivate() != null) event.setIsPrivate(request.getIsPrivate());
        if (request.getAgeRestriction() != null) event.setAgeRestriction(request.getAgeRestriction());
        if (request.getMaxTicketsPerOrder() != null) event.setMaxTicketsPerOrder(request.getMaxTicketsPerOrder());
        if (request.getCoverImageUrl() != null) event.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getStatus() != null) event.setStatus(request.getStatus());

        return eventRepository.save(event);
    }

    public az.tickit.event.dto.EventStatsResponse getEventStatistics(String eventId, String organizerEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getOrganizerId().equals(organizerEmail)) {
            throw new RuntimeException("Access denied");
        }

        List<Order> orders = orderRepository.findByEventIdOrderByCreatedAtDesc(eventId);

        double totalRevenue = orders.stream()
                .filter(o -> "SUCCESS".equals(o.getStatus()) || "Ödənilib".equals(o.getStatus()))
                .mapToDouble(Order::getTotalAmount)
                .sum();

        int realSoldTickets = orders.stream()
                .filter(o -> "SUCCESS".equals(o.getStatus()) || "Ödənilib".equals(o.getStatus()))
                .mapToInt(o -> o.getSeatIds() != null ? o.getSeatIds().size() : 1)
                .sum();

        DateTimeFormatter chartFormatter = DateTimeFormatter.ofPattern("dd/MM");
        List<az.tickit.event.dto.SalesHistoryData> history = orders.stream()
                .filter(o -> ("SUCCESS".equals(o.getStatus()) || "Ödənilib".equals(o.getStatus())) && o.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().format(chartFormatter),
                        Collectors.summingDouble(o -> o.getSeatIds() != null ? o.getSeatIds().size() : 1.0)
                ))
                .entrySet().stream()
                .map(entry -> new az.tickit.event.dto.SalesHistoryData(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(az.tickit.event.dto.SalesHistoryData::getDate))
                .collect(Collectors.toList());

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy, HH:mm");
        List<az.tickit.event.dto.EventStatsResponse.OrderSummary> recentOrders = orders.stream()
                .limit(5)
                .map(o -> {
                    az.tickit.event.dto.EventStatsResponse.OrderSummary summary = new az.tickit.event.dto.EventStatsResponse.OrderSummary();
                    summary.setId(o.getId().substring(Math.max(0, o.getId().length() - 6)).toUpperCase());
                    summary.setCustomer(o.getCustomerName());
                    summary.setEmail(o.getCustomerEmail());
                    summary.setCustomerPhone(o.getCustomerPhone() != null ? o.getCustomerPhone() : "-");
                    summary.setType(String.valueOf(o.getSeatIds() != null ? o.getSeatIds().size() : 1));

                    // ДОБАВЛЕННЫЕ ПОЛЯ ДЛЯ СКИДОК
                    summary.setAmount(o.getTotalAmount()); // Финальная цена
                    summary.setOriginalAmount(o.getOriginalAmount()); // Изначальная цена (из Order)
                    summary.setPromoCode(o.getPromoCode()); // Примененный код (из Order)

                    summary.setDate(o.getCreatedAt() != null ? o.getCreatedAt().format(formatter) : "Bu gün");
                    summary.setStatus("success");
                    return summary;
                })
                .collect(Collectors.toList());

        int currentViews = event.getViews() != null ? event.getViews() : 0;
        double conversion = currentViews > 0 ? ((double) realSoldTickets / currentViews) * 100 : 0.0;

        az.tickit.event.dto.EventStatsResponse response = new az.tickit.event.dto.EventStatsResponse();
        response.setRevenue(totalRevenue);
        response.setSold(realSoldTickets);
        response.setTotal(event.getTotalCapacity() != null ? event.getTotalCapacity() : 100);
        response.setViews(currentViews);
        response.setConversionRate(Math.round(conversion * 10.0) / 10.0);
        response.setRecentOrders(recentOrders);
        response.setSalesHistory(history);

        return response;
    }

    public void deleteEvent(String eventId, String organizerEmail) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Not found"));
        if (!event.getOrganizerId().equals(organizerEmail)) throw new RuntimeException("No permission");
        event.setDeleted(true);
        eventRepository.save(event);
    }

    public Event getEventByShortLink(String shortLink) {
        Event event = eventRepository.findByShortLink(shortLink).filter(e -> !e.isDeleted()).orElseThrow(() -> new RuntimeException("Not found"));
        int currentViews = event.getViews() != null ? event.getViews() : 0;
        event.setViews(currentViews + 1);
        eventRepository.save(event);
        return event;
    }

    private BigDecimal calculatePlatformFee(int capacity) {
        if (capacity <= 10) return BigDecimal.ZERO;
        if (capacity <= 50) return new BigDecimal("5.00");
        if (capacity <= 100) return new BigDecimal("10.00");
        return new BigDecimal("15.00");
    }

    public Event getEventById(String id) {
        return eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
    }

    public List<Order> getAllEventOrders(String eventId, String organizerEmail) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Not found"));
        if (!event.getOrganizerId().equals(organizerEmail)) throw new RuntimeException("Access denied");
        return orderRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    public List<Event> getEventsByOrganizer(String organizerEmail) {
        // 1. Берем все ивенты организатора из репозитория
        List<Event> allEvents = eventRepository.findByOrganizerId(organizerEmail);

        // 2. Фильтруем: оставляем только те, где deleted == false.
        // Так как это примитив boolean, по умолчанию там всегда false, если не удалено.
        return allEvents.stream()
                .filter(e -> !e.isDeleted())
                .collect(Collectors.toList());
    }
}