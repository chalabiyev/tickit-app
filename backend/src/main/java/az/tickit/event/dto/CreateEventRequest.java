package az.tickit.event.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class CreateEventRequest {

    @NotBlank(message = "Название обязательно")
    private String title;

    @NotBlank(message = "Описание обязательно")
    private String description;

    @NotBlank(message = "Категория обязательна")
    private String category;

    @NotBlank(message = "Возрастной лимит обязателен")
    private String ageRestriction;

    @NotNull(message = "Дата обязательна")
    private LocalDate eventDate;

    @NotNull(message = "Время начала обязательно")
    private LocalTime startTime;

    @NotNull(message = "Время конца обязательно")
    private LocalTime endTime;

    @NotNull(message = "Укажите тип локации (онлайн/оффлайн)")
    private Boolean isPhysical;

    private String venueName;
    private String address;

    @NotNull(message = "Укажите приватность")
    private Boolean isPrivate;

    private String coverImageUrl;

    @NotEmpty(message = "Должен быть хотя бы один тип билета")
    @Valid
    private List<TicketTierDto> tiers;

    @NotNull(message = "Укажите тип рассадки")
    private Boolean isReservedSeating;

    @Valid
    private List<SeatDto> seats;

    @Data
    public static class TicketTierDto {
        private String id;
        private String tierId; // <-- ДОБАВЛЕНО ЭТО ПОЛЕ (очень важно для связи с местами!)
        @NotBlank private String name;
        @NotNull @Min(0) private BigDecimal price;
        @NotNull @Min(1) private Integer quantity;
        private String color;
    }

    @Data
    public static class SeatDto {
        @NotNull private Integer row;
        @NotNull private Integer col;
        @NotBlank private String tierId;
    }

    private Object seatMapConfig;
    private Object ticketDesign;

    private List<BuyerQuestion> buyerQuestions;
}