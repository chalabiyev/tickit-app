package az.tickit.auth;

import az.tickit.auth.dto.AuthResponse;
import az.tickit.auth.dto.LoginRequest;
import az.tickit.auth.dto.RegisterRequest;
import az.tickit.security.JwtService;
import az.tickit.user.User;
import az.tickit.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is already in use"
            );
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(normalizePhone(request.getPhone()));
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_USER");

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }

    private String normalizePhone(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        String cleaned = trimmed.replaceAll("[\\s()-]", "");

        boolean startsWithPlus = cleaned.startsWith("+");
        cleaned = cleaned.replaceAll("\\+", "");

        if (startsWithPlus) {
            cleaned = "+" + cleaned;
        } else {
            cleaned = "+" + cleaned;
        }

        // Collapse duplicated country code like +994994XXXX -> +994XXXX
        String pattern = "^\\+(\\d{1,3})\\1(\\d+)$";
        if (cleaned.matches(pattern)) {
            cleaned = cleaned.replaceFirst(pattern, "+$1$2");
        }

        return cleaned;
    }
}

