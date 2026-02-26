package az.tickit.event;

import az.tickit.event.dto.BuyerQuestion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "events")
public class Event {
    @Id
    private String id;
    private String organizerId; // ID создателя (берем из токена)

    private String title;
    private String description;
    private String category;
    private String ageRestriction;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private Boolean isPhysical;
    private String venueName;
    private String address;

    private Boolean isPrivate;
    private String coverImageUrl;

    @Builder.Default
    private List<TicketTier> tiers = new ArrayList<>();

    private Boolean isReservedSeating;

    @Builder.Default
    private List<Seat> seats = new ArrayList<>();

    // Системные поля (Бэкенд считает их сам)
    private Integer totalCapacity;
    private BigDecimal platformFee;
    private String shortLink;
    private String status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private boolean deleted = false;

    private Object seatMapConfig; // Сюда мы будем сохранять настройки сцены и рядов
    private Object ticketDesign;

    private List<BuyerQuestion> buyerQuestions;
}