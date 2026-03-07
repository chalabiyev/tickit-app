package az.eticksystem.event.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class CreateEventRequest {

    @NotBlank(message = "Tədbirin adı mütləqdir")
    private String title;

    @NotBlank(message = "Təsvir mütləqdir")
    private String description;

    @NotBlank(message = "Kateqoriya mütləqdir")
    private String category;

    @NotBlank(message = "Yaş məhdudiyyəti mütləqdir")
    private String ageRestriction;

    @NotNull(message = "Tarix mütləqdir")
    private LocalDate eventDate;

    @NotNull(message = "Başlanğıc vaxtı mütləqdir")
    private LocalTime startTime;

    @NotNull(message = "Bitmə vaxtı mütləqdir")
    private LocalTime endTime;

    @NotNull(message = "Məkanın növünü göstərin (onlayn/fiziki)")
    private Boolean isPhysical;

    private String venueName;
    private String address;
    /** GPS coordinates from LocationPicker — used for Google Maps link on public page */
    private Double lat;
    private Double lng;

    @NotNull(message = "Məxfiliyi göstərin")
    private Boolean isPrivate;

    private String coverImageUrl;

    @NotEmpty(message = "Ən azı bir bilet növü olmalıdır")
    @Valid
    private List<TicketTierDto> tiers;

    @NotNull(message = "Oturacaq növünü göstərin")
    private Boolean isReservedSeating;

    @Valid
    private List<SeatDto> seats;

    private Object seatMapConfig;
    private Object ticketDesign;

    private List<BuyerQuestion> buyerQuestions;

    private Integer maxTicketsPerOrder;

    private String streamUrl;
    private String streamPassword;

    /** FAQ entries added in the wizard FAQ step */
    @Valid
    private List<FaqItem> faq;

    // ── Nested DTOs ───────────────────────────────────────────────────────

    @Data
    public static class TicketTierDto {
        private String id;
        private String tierId;

        @NotBlank(message = "Bilet növünün adı boş ola bilməz")
        private String name;

        @NotNull(message = "Qiymət mütləqdir")
        @Min(value = 0, message = "Qiymət mənfi ola bilməz")
        private BigDecimal price;

        @NotNull(message = "Miqdar mütləqdir")
        @Min(value = 1, message = "Miqdar ən azı 1 olmalıdır")
        private Integer quantity;

        private String color;
    }

    @Data
    public static class SeatDto {
        @NotNull(message = "Sıra mütləqdir")
        private Integer row;

        @NotNull(message = "Sütun mütləqdir")
        private Integer col;

        @NotBlank(message = "Bilet növü ID-si boş ola bilməz")
        private String tierId;
    }
}