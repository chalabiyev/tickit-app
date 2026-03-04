package az.tickit.user;

import az.tickit.auth.dto.ProfileRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı: " + email));
    }

    public User updateProfile(String email, ProfileRequest request) {
        User user = findByEmail(email);

        // Обновляем поля (теперь они есть в модели User)
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getCompanyName() != null) user.setCompanyName(request.getCompanyName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

        // Опционально: обновляем fullName, если прислали имя и фамилию
        if (request.getFirstName() != null && request.getLastName() != null) {
            user.setFullName(request.getFirstName() + " " + request.getLastName());
        }

        return userRepository.save(user);
    }
}