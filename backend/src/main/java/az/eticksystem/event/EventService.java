package az.eticksystem.event;

import az.eticksystem.event.dto.*;
import az.eticksystem.order.Order;
import az.eticksystem.order.OrderRepository;
import az.eticksystem.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private static final DateTimeFormatter CHART_FMT = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter ORDER_FMT  = DateTimeFormatter.ofPattern("dd.MM.yyyy, HH:mm");

    // Статусы успешных заказов в одном месте — DRY
    private static final Set<String> SUCCESS_STATUSES = Set.of("SUCCESS", "Ödənilib");

    private final EventRepository eventRepository;
    private final OrderRepository orderRepository;
    private final UserRepository  userRepository;

    // ── Create ────────────────────────────────────────────────────────────

    public Event createEvent(CreateEventRequest request, String organizerEmail) {
        int totalCapacity = request.getTiers().stream()
                .mapToInt(CreateEventRequest.TicketTierDto::getQuantity)
                .sum();

        List<TicketTier> tiers = request.getTiers().stream()
                .map(dto -> TicketTier.builder()
                        .tierId(dto.getTierId() != null ? dto.getTierId() : dto.getId())
                        .name(dto.getName())
                        .price(dto.getPrice() != null ? dto.getPrice().doubleValue() : 0.0)
                        .quantity(dto.getQuantity())
                        .color(dto.getColor())
                        .build())
                .collect(Collectors.toList());

        List<Seat> seats = List.of();
        if (Boolean.TRUE.equals(request.getIsReservedSeating()) && request.getSeats() != null) {
            seats = request.getSeats().stream()
                    .map(dto -> Seat.builder()
                            .row(dto.getRow())
                            .col(dto.getCol())
                            .tierId(dto.getTierId())
                            .build())
                    .collect(Collectors.toList());
        }

        String shortLink = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

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
                .seats(seats)
                .seatMapConfig(request.getSeatMapConfig())
                .ticketDesign(request.getTicketDesign())
                .buyerQuestions(request.getBuyerQuestions())
                .totalCapacity(totalCapacity)
                .faq(request.getFaq() != null ? request.getFaq() : new ArrayList<>())
                .platformFee(calculatePlatformFee(totalCapacity))
                .shortLink(shortLink)
                .status("PUBLISHED")
                .deleted(false)
                .views(0)
                .soldSeats(new ArrayList<>())
                .adminSeats(new ArrayList<>())
                .build();

        event.setStreamUrl(request.getStreamUrl());
        event.setStreamPassword(request.getStreamPassword());

        Event saved = eventRepository.save(event);
        log.info("Event created: id={} title='{}' organizer={}", saved.getId(), saved.getTitle(), organizerEmail);
        return saved;
    }

    // ── Update ────────────────────────────────────────────────────────────

    public Event updateEvent(String eventId, String organizerEmail, UpdateEventRequest request) {
        Event event = findEventOrThrow(eventId);
        checkOwnership(event, organizerEmail);

        if (request.getTitle()             != null) event.setTitle(request.getTitle());
        if (request.getDescription()       != null) event.setDescription(request.getDescription());
        if (request.getCategory()          != null) event.setCategory(request.getCategory());
        if (request.getEventDate()         != null) event.setEventDate(request.getEventDate());
        if (request.getStartTime()         != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime()           != null) event.setEndTime(request.getEndTime());
        if (request.getIsPhysical()        != null) event.setIsPhysical(request.getIsPhysical());
        if (request.getVenueName()         != null) event.setVenueName(request.getVenueName());
        if (request.getAddress()           != null) event.setAddress(request.getAddress());
        if (request.getIsPrivate()         != null) event.setIsPrivate(request.getIsPrivate());
        if (request.getAgeRestriction()    != null) event.setAgeRestriction(request.getAgeRestriction());
        if (request.getMaxTicketsPerOrder()!= null) event.setMaxTicketsPerOrder(request.getMaxTicketsPerOrder());
        if (request.getCoverImageUrl()     != null) event.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getStatus()            != null) event.setStatus(request.getStatus());
        if (request.getFaq() != null)               event.setFaq(request.getFaq());

        return eventRepository.save(event);
    }

    // ── Delete (soft) ─────────────────────────────────────────────────────

    public void deleteEvent(String eventId, String organizerEmail) {
        Event event = findEventOrThrow(eventId);
        checkOwnership(event, organizerEmail);
        event.setDeleted(true);
        eventRepository.save(event);
        log.info("Event soft-deleted: id={} by={}", eventId, organizerEmail);
    }

    // ── Read ──────────────────────────────────────────────────────────────

    public Event getEventById(String id) {
        return findEventOrThrow(id);
    }

    public List<Event> getEventsByOrganizer(String organizerEmail) {
        return eventRepository.findByOrganizerIdAndDeletedFalse(organizerEmail);
    }

    public Event getEventByShortLink(String shortLink) {
        Event event = eventRepository.findByShortLink(shortLink)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        userRepository.findByEmail(event.getOrganizerId()).ifPresent(user -> {
            String companyName = (user.getCompanyName() != null && !user.getCompanyName().isEmpty())
                    ? user.getCompanyName()
                    : (user.getFullName() != null ? user.getFullName() : user.getFirstName());
            event.setOrganizerCompanyName(companyName);
            event.setOrganizerCompanyPhone(user.getPhone());
        });

        return event;
    }

    public List<Order> getAllEventOrders(String eventId, String organizerEmail) {
        Event event = findEventOrThrow(eventId);
        checkOwnership(event, organizerEmail);
        return orderRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    // ── Statistics ────────────────────────────────────────────────────────

    public EventStatsResponse getEventStatistics(String eventId, String organizerEmail) {
        Event event = findEventOrThrow(eventId);
        checkOwnership(event, organizerEmail);

        List<Order> orders = orderRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        List<Order> successOrders = filterSuccess(orders);

        double totalRevenue    = successOrders.stream().mapToDouble(Order::getTotalAmount).sum();
        int    realSoldTickets = successOrders.stream().mapToInt(o -> seatCount(o)).sum();
        int    currentViews    = event.getViews() != null ? event.getViews() : 0;
        double conversion      = currentViews > 0 ? ((double) realSoldTickets / currentViews) * 100 : 0.0;

        List<SalesHistoryData> history = buildSalesHistory(successOrders);

        List<EventStatsResponse.OrderSummary> recentOrders = orders.stream()
                .map(o -> {
                    EventStatsResponse.OrderSummary s = new EventStatsResponse.OrderSummary();
                    s.setId(o.getId().substring(Math.max(0, o.getId().length() - 6)).toUpperCase());
                    s.setCustomer(o.getCustomerName());
                    s.setEmail(o.getCustomerEmail());
                    s.setCustomerPhone(o.getCustomerPhone() != null ? o.getCustomerPhone() : "-");
                    s.setType(String.valueOf(seatCount(o)));
                    s.setAmount(o.getTotalAmount());
                    s.setOriginalAmount(o.getOriginalAmount());
                    s.setPromoCode(o.getPromoCode());
                    s.setDate(o.getCreatedAt() != null ? o.getCreatedAt().format(ORDER_FMT) : "Bu gün");
                    s.setStatus("success");
                    return s;
                })
                .collect(Collectors.toList());

        EventStatsResponse response = new EventStatsResponse();
        response.setRevenue(totalRevenue);
        response.setSold(realSoldTickets);
        response.setTotal(event.getTotalCapacity() != null ? event.getTotalCapacity() : 100);
        response.setViews(currentViews);
        response.setConversionRate(Math.round(conversion * 10.0) / 10.0);
        response.setRecentOrders(recentOrders);
        response.setSalesHistory(history);
        response.setAdminSeats(event.getAdminSeats() != null ? event.getAdminSeats() : new ArrayList<>());
        return response;
    }

    public GlobalStatsResponse getGlobalStatistics(String organizerEmail) {
        List<Event> myEvents = eventRepository.findByOrganizerIdAndDeletedFalse(organizerEmail);

        LocalDate today = LocalDate.now();
        double totalRevenue    = 0;
        int    totalSold       = 0;
        int    totalViews      = 0;
        int    activeEvents    = 0;
        Map<String, Double> combinedHistory = new HashMap<>();

        for (Event event : myEvents) {
            totalSold  += event.getSold()  != null ? event.getSold()  : 0;
            totalViews += event.getViews() != null ? event.getViews() : 0;

            boolean isFutureOrToday = event.getEventDate() != null
                    && event.getEventDate().compareTo(today) >= 0;

            if ("PUBLISHED".equalsIgnoreCase(event.getStatus()) && isFutureOrToday) {
                activeEvents++;
            }

            List<Order> orders = orderRepository.findByEventIdOrderByCreatedAtDesc(event.getId());
            totalRevenue += filterSuccess(orders).stream().mapToDouble(Order::getTotalAmount).sum();

            filterSuccess(orders).stream()
                    .filter(o -> o.getCreatedAt() != null)
                    .forEach(o -> {
                        String key = o.getCreatedAt().format(CHART_FMT);
                        combinedHistory.merge(key, (double) seatCount(o), Double::sum);
                    });
        }

        List<SalesHistoryData> history = combinedHistory.entrySet().stream()
                .map(e -> new SalesHistoryData(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(SalesHistoryData::getDate))
                .collect(Collectors.toList());

        return GlobalStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalSold(totalSold)
                .totalViews(totalViews)
                .activeEvents(activeEvents)
                .salesHistory(history)
                .build();
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private Event findEventOrThrow(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    private void checkOwnership(Event event, String organizerEmail) {
        if (!event.getOrganizerId().equals(organizerEmail)) {
            log.warn("Unauthorized event access attempt: event={} by={}", event.getId(), organizerEmail);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private List<Order> filterSuccess(List<Order> orders) {
        return orders.stream()
                .filter(o -> SUCCESS_STATUSES.contains(o.getStatus()))
                .collect(Collectors.toList());
    }

    private int seatCount(Order o) {
        return o.getSeatIds() != null ? o.getSeatIds().size() : 1;
    }

    private List<SalesHistoryData> buildSalesHistory(List<Order> successOrders) {
        return successOrders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().format(CHART_FMT),
                        Collectors.summingDouble(o -> seatCount(o))
                ))
                .entrySet().stream()
                .map(e -> new SalesHistoryData(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(SalesHistoryData::getDate))
                .collect(Collectors.toList());
    }

    private BigDecimal calculatePlatformFee(int capacity) {
        if (capacity <= 10)  return BigDecimal.ZERO;
        if (capacity <= 50)  return new BigDecimal("5.00");
        if (capacity <= 100) return new BigDecimal("10.00");
        return new BigDecimal("15.00");
    }
}