package az.eticksystem.auth;

import az.eticksystem.auth.dto.AuthResponse;
import az.eticksystem.auth.dto.LoginRequest;
import az.eticksystem.auth.dto.RegisterRequest;
import az.eticksystem.security.JwtService;
import az.eticksystem.user.User;
import az.eticksystem.user.UserRepository;
import az.eticksystem.utils.email.EmailService;
import az.eticksystem.utils.otp.OtpCode;
import az.eticksystem.utils.otp.OtpRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
// НЕТ @CrossOrigin — CORS настроен глобально в SecurityConfig
public class AuthController {

    private final AuthService       authService;
    private final OtpRepository     otpRepository;
    private final EmailService      emailService;
    private final JwtService        jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository    userRepository;
    private final PasswordEncoder   passwordEncoder;

    // Криптографически безопасный генератор — в отличие от new Random()
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String type  = (String) request.get("type"); // "LOGIN" | "REGISTER" | "RESET"

        if (email == null || !email.matches(EMAIL_REGEX)) {
            return ResponseEntity.badRequest().body("Düzgün e-poçt ünvanı daxil edin");
        }

        boolean userExists = userRepository.existsByEmail(email);

        if ("REGISTER".equals(type) && userExists) {
            return ResponseEntity.badRequest()
                    .body("Bu e-poçt artıq qeydiyyatdan keçib. Zəhmət olmasa daxil olun.");
        }
        if (("LOGIN".equals(type) || "RESET".equals(type)) && !userExists) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Bu e-poçt ilə hesab tapılmadı.");
        }

        // SecureRandom вместо Random — криптографически безопасно
        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        OtpCode otp = new OtpCode();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setType(type);
        otp.setExpiry(LocalDateTime.now().plusMinutes(5));

        if ("REGISTER".equals(type)) {
            otp.setRegistrationData(Map.of(
                    "fullName", String.valueOf(request.getOrDefault("fullName", "")),
                    "phone",    String.valueOf(request.getOrDefault("phone", "")),
                    "password", String.valueOf(request.getOrDefault("password", ""))
            ));
        }

        otpRepository.save(otp);
        log.info("OTP requested for email: {} type: {}", email, type);

        emailService.sendSimpleMessage(email,
                "eticksystem: Təsdiqləmə kodu",
                buildOtpEmailHtml(code)
        );

        return ResponseEntity.ok(Map.of("message", "Sent"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code  = request.get("code");

        return otpRepository.findById(email)
                .map(otp -> {
                    if (!otp.getCode().equals(code) || otp.getExpiry().isBefore(LocalDateTime.now())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body("Kod yanlışdır və ya vaxtı bitib");
                    }

                    if ("REGISTER".equals(otp.getType())) {
                        User newUser = new User();
                        newUser.setEmail(otp.getEmail());
                        newUser.setFullName(otp.getRegistrationData().get("fullName"));
                        newUser.setPhone(otp.getRegistrationData().get("phone"));
                        newUser.setPassword(passwordEncoder.encode(otp.getRegistrationData().get("password")));
                        newUser.setRole("ROLE_USER");
                        userRepository.save(newUser);
                        log.info("New user registered via OTP: {}", email);
                    }

                    otpRepository.deleteById(email);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    String token = jwtService.generateToken(userDetails);
                    return ResponseEntity.ok(Map.of("token", token));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Kod tapılmadı"));
    }

    @PostMapping("/check-otp")
    public ResponseEntity<?> checkOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code  = request.get("code");

        return otpRepository.findById(email)
                .map(otp -> {
                    boolean valid = otp.getCode().equals(code)
                            && otp.getExpiry().isAfter(LocalDateTime.now());
                    if (valid) return ResponseEntity.ok(Map.of("valid", true));
                    return ResponseEntity.badRequest().body("Kod yanlışdır və ya vaxtı bitib");
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Kod tapılmadı"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email       = request.get("email");
        String code        = request.get("code");
        String newPassword = request.get("newPassword");

        return otpRepository.findById(email)
                .map(otp -> {
                    boolean valid = otp.getCode().equals(code)
                            && otp.getExpiry().isAfter(LocalDateTime.now())
                            && "RESET".equals(otp.getType());

                    if (!valid) {
                        return ResponseEntity.badRequest().body("Kod yanlışdır və ya vaxtı bitib");
                    }

                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("User not found: " + email));

                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                    otpRepository.deleteById(email);
                    log.info("Password reset for user: {}", email);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    String token = jwtService.generateToken(userDetails);
                    return ResponseEntity.ok(Map.of("token", token));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Kod tapılmadı"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    private String buildOtpEmailHtml(String code) {
        return """
            <div style="font-family:sans-serif;text-align:center;padding:40px 20px;background:#f5f5f5;">
              <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <h2 style="color:#111;margin-bottom:8px;">eticksystem</h2>
                <p style="color:#555;font-size:16px;margin-bottom:24px;">Sizin təsdiqləmə kodunuz:</p>
                <div style="background:#f0f4ff;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <span style="color:#2563eb;letter-spacing:10px;font-size:36px;font-weight:bold;">%s</span>
                </div>
                <p style="color:#999;font-size:13px;">Kod 5 dəqiqə ərzində etibarlıdır.</p>
                <p style="color:#ccc;font-size:11px;margin-top:24px;">Bu məktubu siz tələb etməmisinizsə, nəzərə almayın.</p>
              </div>
            </div>
            """.formatted(code);
    }
}