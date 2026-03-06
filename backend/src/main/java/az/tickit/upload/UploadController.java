package az.tickit.upload; // твой пакет

import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/upload")
public class UploadController {

    private final String UPLOAD_DIR = "uploads/";

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Fayl seçilməyib"); // Файл не выбран
        }

        try {
            // 1. Убеждаемся, что папка uploads существует
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            // 2. Генерируем уникальное имя файла и ЖЕСТКО ставим расширение .webp
            String fileName = UUID.randomUUID().toString() + ".webp";
            File outputFile = new File(UPLOAD_DIR + fileName);

            // 3. МАГИЯ ОПТИМИЗАЦИИ
            ImmutableImage.loader()
                    .fromStream(file.getInputStream())
                    .max(1920, 1080) // Ограничиваем размер. Если фотка 4K, она сожмется до Full HD
                    .output(WebpWriter.DEFAULT.withQ(80), outputFile); // withQ(80) — это качество 80%. Идеальный баланс веса и качества

            // 4. Формируем ссылку для фронтенда
            String fileUrl = "/uploads/" + fileName;

            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Şəkil yüklənərkən xəta baş verdi");
        }
    }
}