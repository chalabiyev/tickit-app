package az.eticksystem.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService  userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest  request,
            HttpServletResponse response,
            FilterChain         filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);

        // Защита от фронтенда который шлёт "null" или "" как строку
        if (jwt.isBlank() || jwt.equals("null") || jwt.equals("undefined")) {
            log.warn("Received invalid JWT placeholder in Authorization header");
            filterChain.doFilter(request, response);
            return;
        }

        String username;
        try {
            username = jwtService.extractUsername(jwt);
        } catch (Exception ex) {
            log.warn("Failed to extract username from JWT: {}", ex.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        // Устанавливаем аутентификацию только если контекст пустой
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("Authenticated user [{}] via JWT", username);
            } else {
                log.warn("Invalid JWT token for user [{}]", username);
            }
        }

        filterChain.doFilter(request, response);
    }
}