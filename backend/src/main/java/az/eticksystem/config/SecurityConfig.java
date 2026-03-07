package az.eticksystem.config;

import az.eticksystem.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    // Берём список разрешённых origin из конфига — не хардкодим localhost
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // strength=12 для prod
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                // Stateless — JWT, сессии не нужны
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Auth — публичные
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // Uploads — публичные (статика)
                        .requestMatchers("/uploads/**").permitAll()

                        // Публичная страница ивента
                        .requestMatchers(HttpMethod.GET, "/api/v1/events/s/**").permitAll()

                        // Создание заказа — публичное (покупка без аккаунта)
                        .requestMatchers(HttpMethod.POST, "/api/v1/orders/create").permitAll()

                        // Валидация промокода — публичная
                        .requestMatchers(HttpMethod.GET, "/api/v1/promocodes/validate").permitAll()

                        // Отправка билета на email — публичная (вызывается после оплаты)
                        .requestMatchers(HttpMethod.POST, "/api/v1/email/send-ticket").permitAll()

                        // Генерация PDF — публичная
                        .requestMatchers("/api/v1/tickets/generate-pdf").permitAll()

                        // Всё остальное — только авторизованным
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Разбиваем строку из конфига по запятой: "http://localhost:3000,https://eticksystem.com"
        List<String> origins = List.of(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // браузер кеширует preflight на 1 час

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}