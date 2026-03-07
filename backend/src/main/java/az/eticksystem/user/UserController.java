package az.eticksystem.user;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/users")
// НЕТ @CrossOrigin — CORS настроен глобально в SecurityConfig
public class UserController {

    @GetMapping("/me")
    public UserMeResponse me(@AuthenticationPrincipal User user) {
        log.debug("Profile requested for user: {}", user.getEmail());
        return new UserMeResponse(
                user.getFullName(),
                user.getEmail(),
                user.getPhone()
        );
    }
}