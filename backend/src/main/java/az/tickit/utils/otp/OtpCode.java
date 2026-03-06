package az.tickit.utils.otp;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Document(collection = "otp_codes")
public class OtpCode {
    @Id
    private String email;
    private String code;
    private LocalDateTime expiry;
    private String type; // "LOGIN" или "REGISTER"
    private Map<String, String> registrationData; // Для хранения данных нового юзера
}