package az.eticksystem.auth.dto;

import lombok.Data;

@Data
public class ProfileRequest {
    private String firstName;
    private String lastName;
    private String companyName;
    private String phone;
    private String avatarUrl;
    private String voen;
    private String legalAddress;
    private String responsiblePerson;
    private String extraContact;
    private String instagramUrl;
    private String websiteUrl;
    private String iban;
    private String bankName;
}