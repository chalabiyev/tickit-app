package az.eticksystem.event;

import az.eticksystem.event.dto.BuyerQuestion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
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
    private String organizerId;

    private String title;
    private String description;
    private String category;
    private String ageRestriction;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private Boolean isPhysical;
    private String  venueName;
    private String  address;

    private Boolean isPrivate;
    private String  coverImageUrl;

    @Builder.Default
    private List<TicketTier> tiers = new ArrayList<>();

    private Boolean isReservedSeating;

    @Builder.Default
    private List<Seat> seats = new ArrayList<>();

    // Системные поля
    private Integer    totalCapacity;
    private BigDecimal platformFee;
    private String     shortLink;
    private String     status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private boolean deleted = false;

    private Object seatMapConfig;
    private Object ticketDesign;

    private List<BuyerQuestion> buyerQuestions;
    private Integer             maxTicketsPerOrder;

    @Builder.Default
    private List<String> soldSeats = new ArrayList<>();
    private Integer sold = 0;

    private String streamUrl;
    private String streamPassword;
    private Integer views;

    @Builder.Default
    private List<String> adminSeats = new ArrayList<>();

    // Поля не сохраняются в MongoDB — заполняются в сервисе перед отдачей на фронт
    @Transient
    private String organizerCompanyName;

    @Transient
    private String organizerCompanyPhone;
}