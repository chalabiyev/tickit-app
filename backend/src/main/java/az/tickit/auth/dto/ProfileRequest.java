package az.tickit.auth.dto;

import lombok.Data;

@Data
public class ProfileRequest {
    private String firstName;
    private String lastName;
    private String companyName; // Название для бренда на билетах
    private String phone;
    private String avatarUrl;
}