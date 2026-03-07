package az.eticksystem.user;

import az.eticksystem.auth.dto.ProfileRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", email);
                    return new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "İstifadəçi tapılmadı"
                    );
                });
    }

    public User updateProfile(String email, ProfileRequest request) {
        User user = findByEmail(email);

        if (request.getFirstName()   != null) user.setFirstName(request.getFirstName());
        if (request.getLastName()    != null) user.setLastName(request.getLastName());
        if (request.getCompanyName() != null) user.setCompanyName(request.getCompanyName());
        if (request.getPhone()       != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl()   != null) user.setAvatarUrl(request.getAvatarUrl());

        // Синхронизируем fullName если обновлены имя и фамилия
        if (request.getFirstName() != null && request.getLastName() != null) {
            user.setFullName(request.getFirstName() + " " + request.getLastName());
        }

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", email);
        return saved;
    }
}