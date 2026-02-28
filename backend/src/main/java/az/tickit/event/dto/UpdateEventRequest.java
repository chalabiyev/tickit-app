package az.tickit.event.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class UpdateEventRequest {
    private String title;
    private String description;
    private String category;

    // Новые поля для обновления дат и времени
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;

    // Новые поля для локации
    private Boolean isPhysical;
    private String venueName;
    private String address;

    // Новые поля для настроек (приватность, возраст, лимит билетов)
    private Boolean isPrivate;
    private String ageRestriction;
    private Integer maxTicketsPerOrder;

    private String coverImageUrl;
}