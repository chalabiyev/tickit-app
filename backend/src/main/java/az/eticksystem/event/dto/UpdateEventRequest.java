package az.eticksystem.event.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class UpdateEventRequest {
    private String    title;
    private String    description;
    private String    category;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean   isPhysical;
    private String    venueName;
    private String    address;
    private Boolean   isPrivate;
    private String    ageRestriction;
    private Integer   maxTicketsPerOrder;
    private String    coverImageUrl;
    private String    status;
}