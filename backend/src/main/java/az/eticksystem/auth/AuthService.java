package az.eticksystem.auth;

import az.eticksystem.auth.dto.AuthResponse;
import az.eticksystem.auth.dto.LoginRequest;
import az.eticksystem.auth.dto.RegisterRequest;
import az.eticksystem.security.JwtService;
import az.eticksystem.user.User;
import az.eticksystem.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService      jwtService;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    // Намеренно НЕ говорим "email не найден" — чтобы не раскрывать список юзеров
                    log.warn("Login attempt for non-existent email: {}", request.getEmail());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Failed login attempt for email: {}", request.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        log.info("User logged in: {}", request.getEmail());
        return new AuthResponse(jwtService.generateToken(user));
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration attempt with existing email: {}", request.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already in use");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(normalizePhone(request.getPhone()));
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_USER");

        userRepository.save(user);
        log.info("New user registered: {}", request.getEmail());

        return new AuthResponse(jwtService.generateToken(user));
    }

    /**
     * Нормализует номер телефона к формату +XXXXXXXXXXX
     * Убирает пробелы, тире, скобки, дублированный код страны.
     */
    private String normalizePhone(String raw) {
        if (raw == null) return null;

        // Убираем всё кроме цифр и ведущего +
        String cleaned = raw.trim().replaceAll("[\\s()\\-]", "");

        // Убираем все + и добавляем один в начало
        cleaned = "+" + cleaned.replaceAll("\\+", "");

        // Убираем дублированный код страны: +994994XXXXXXX → +994XXXXXXX
        cleaned = cleaned.replaceFirst("^\\+(\\d{1,3})\\1(\\d+)$", "+$1$2");

        return cleaned;
    }
}