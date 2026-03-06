package az.tickit.auth;

import az.tickit.auth.dto.AuthResponse;
import az.tickit.auth.dto.LoginRequest;
import az.tickit.auth.dto.RegisterRequest;
import az.tickit.security.JwtService;
import az.tickit.user.User;
import az.tickit.user.UserRepository;
import az.tickit.utils.email.EmailService;
import az.tickit.utils.otp.OtpCode;
import az.tickit.utils.otp.OtpRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Random;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;
    private final OtpRepository otpRepository;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String type = (String) request.get("type"); // "LOGIN" или "REGISTER"

        // --- 1. ПРОВЕРКА НА НАСТОЯЩИЙ EMAIL (Формат) ---
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        if (email == null || !email.matches(emailRegex)) {
            // Возвращаем 400 Bad Request, фронт покажет это в тоасте
            return ResponseEntity.status(400).body("Düzgün e-poçt ünvanı daxil edin (məsələn: ad@email.com)");
        }

        // --- 2. ПРОВЕРКА НА УНИКАЛЬНОСТЬ (Существует ли юзер) ---
        boolean userExists = userRepository.existsByEmail(email);

        if ("REGISTER".equals(type) && userExists) {
            // Не даем регаться, если почта уже в базе
            return ResponseEntity.status(400).body("Bu e-poçt artıq qeydiyyatdan keçib. Zəhmət olmasa daxil olun.");
        }

        if ("LOGIN".equals(type) && !userExists) {
            // Не даем логиниться, если почты нет в базе
            return ResponseEntity.status(404).body("Bu e-poçt ilə hesab tapılmadı. Zəhmət olmasa qeydiyyatdan keçin.");
        }

        if ("RESET".equals(type) && !userExists) {
            return ResponseEntity.status(404).body("Bu e-poçt ilə hesab tapılmadı.");
        }

        // --- 3. ГЕНЕРАЦИЯ И ОТПРАВКА КОДА (Если все проверки пройдены) ---
        String code = String.format("%06d", new java.util.Random().nextInt(999999));

        az.tickit.utils.otp.OtpCode otp = new az.tickit.utils.otp.OtpCode();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setType(type);
        otp.setExpiry(java.time.LocalDateTime.now().plusMinutes(5));

        // Если это регистрация, временно "замораживаем" данные юзера до ввода кода
        if ("REGISTER".equals(type)) {
            Map<String, String> data = new java.util.HashMap<>();
            data.put("fullName", (String) request.get("fullName"));
            data.put("phone", (String) request.get("phone"));
            data.put("password", (String) request.get("password"));
            otp.setRegistrationData(data);
        }

        otpRepository.save(otp);

        // Отправка письма
        emailService.sendSimpleMessage(email, "Tickit: Təsdiqləmə kodu",
                "<div style='font-family:sans-serif; text-align:center; padding: 20px;'>" +
                        "<h2 style='color:#333;'>Xoş gəlmisiniz!</h2>" +
                        "<p style='color:#555; font-size:16px;'>Sizin təsdiqləmə kodunuz:</p>" +
                        "<h1 style='color:#2563eb; letter-spacing:5px; font-size: 32px;'>" + code + "</h1>" +
                        "<p style='color:#999; font-size:12px;'>Kod 5 dəqiqə ərzində etibarlıdır.</p>" +
                        "</div>");

        return ResponseEntity.ok().body(Map.of("message", "Sent"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        return otpRepository.findById(email)
                .map(otp -> {
                    if (otp.getCode().equals(code) && otp.getExpiry().isAfter(LocalDateTime.now())) {

                        // Если это была регистрация — создаем юзера именно СЕЙЧАС
                        if ("REGISTER".equals(otp.getType())) {
                            User newUser = new User();
                            newUser.setEmail(otp.getEmail());
                            newUser.setFullName(otp.getRegistrationData().get("fullName"));
                            newUser.setPhone(otp.getRegistrationData().get("phone"));
                            // Шифруем пароль перед сохранением!
                            newUser.setPassword(passwordEncoder.encode(otp.getRegistrationData().get("password")));
                            newUser.setRole("USER");
                            userRepository.save(newUser);
                        }

                        otpRepository.deleteById(email);

                        // Генерируем токен
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        String token = jwtService.generateToken(userDetails);

                        return ResponseEntity.ok(Map.of("token", token));
                    }
                    return ResponseEntity.status(401).body("Kod yanlışdır");
                })
                .orElse(ResponseEntity.status(404).body("Kod tapılmadı"));
    }

    @PostMapping("/check-otp")
    public ResponseEntity<?> checkOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        return otpRepository.findById(email)
                .map(otp -> {
                    // Проверяем, совпадает ли код и не истекло ли время
                    if (otp.getCode().equals(code) && otp.getExpiry().isAfter(java.time.LocalDateTime.now())) {
                        return ResponseEntity.ok(Map.of("valid", true));
                    }
                    return ResponseEntity.status(400).body("Kod yanlışdır və ya vaxtı bitib");
                })
                .orElse(ResponseEntity.status(404).body("Kod tapılmadı"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        return otpRepository.findById(email)
                .map(otp -> {
                    // Проверяем, правильный ли код, не истек ли он и тот ли это тип
                    if (otp.getCode().equals(code) && otp.getExpiry().isAfter(java.time.LocalDateTime.now()) && "RESET".equals(otp.getType())) {

                        // Достаем юзера из базы (используй свой метод поиска по email)
                        az.tickit.user.User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                        // Ставим новый зашифрованный пароль
                        user.setPassword(passwordEncoder.encode(newPassword));
                        userRepository.save(user);

                        // Удаляем использованный код
                        otpRepository.deleteById(email);

                        // Генерируем токен, чтобы юзеру не пришлось логиниться заново
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        String token = jwtService.generateToken(userDetails);

                        return ResponseEntity.ok(Map.of("token", token));
                    }
                    return ResponseEntity.status(400).body("Kod yanlışdır və ya vaxtı bitib");
                })
                .orElse(ResponseEntity.status(404).body("Kod tapılmadı"));
    }
}
