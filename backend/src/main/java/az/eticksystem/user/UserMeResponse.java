package az.eticksystem.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserMeResponse {
    private final String fullName;
    private final String email;
    private final String phone;
}