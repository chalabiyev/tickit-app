package az.tickit.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @GetMapping("/me")
    public UserMeResponse me(@AuthenticationPrincipal User user) {
        return new UserMeResponse(
                user.getFullName(),
                user.getEmail(),
                user.getPhone()
        );
    }
}

