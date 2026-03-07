package az.eticksystem.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Структура ошибки которую видит фронт ─────────────────────────────
    private record ErrorResponse(int status, String message, Instant timestamp) {}

    // ── @Valid ошибки валидации DTO ───────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing // при дублировании берём первое
                ));

        return ResponseEntity.badRequest().body(Map.of(
                "status",    400,
                "message",   "Validation failed",
                "errors",    fieldErrors,
                "timestamp", Instant.now()
        ));
    }

    // ── ResponseStatusException (наши бизнес-ошибки) ─────────────────────
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        log.warn("Business error {}: {}", ex.getStatusCode(), ex.getReason());
        return ResponseEntity
                .status(ex.getStatusCode())
                .body(new ErrorResponse(
                        ex.getStatusCode().value(),
                        ex.getReason(),
                        Instant.now()
                ));
    }

    // ── Всё остальное — 500, но БЕЗ stacktrace на клиент ─────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        // Полный stacktrace только в логах сервера
        log.error("Unexpected error: {}", ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(
                        500,
                        "Internal server error. Please try again later.",
                        Instant.now()
                ));
    }
}