package az.eticksystem.auth;

import az.eticksystem.auth.dto.ProfileRequest;
import az.eticksystem.user.UserService; // Не забудь импорт!
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService; // Теперь IDE не будет ругаться

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        return ResponseEntity.ok(userService.findByEmail(auth.getName()));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody ProfileRequest request, Authentication auth) {
        return ResponseEntity.ok(userService.updateProfile(auth.getName(), request));
    }
}