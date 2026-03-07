package az.eticksystem.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FaqItem {

    @NotBlank(message = "Sual boş ola bilməz")
    private String question;

    @NotBlank(message = "Cavab boş ola bilməz")
    private String answer;
}