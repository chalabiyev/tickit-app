package az.tickit.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final ImageUploadService imageUploadService;

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            // Сохраняем файл и получаем ссылку
            String imageUrl = imageUploadService.saveImage(file);

            // Возвращаем ссылку фронтенду в формате JSON: {"url": "/uploads/123.jpg"}
            return ResponseEntity.ok(Map.of("url", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ошибка при загрузке файла: " + e.getMessage()));
        }
    }
}