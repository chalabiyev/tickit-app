package az.tickit.event.dto;

import lombok.Data;

@Data
public class UpdateEventRequest {
    private String title;
    private String description;
    private String category;
    private String address; // В UI это поле "Location"
    private String coverImageUrl;
}