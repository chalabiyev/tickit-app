package az.eticksystem.upload;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;

import java.io.File;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private static final String UPLOAD_DIR = "uploads/";

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fayl seçilməyib"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Yalnız şəkil faylları qəbul edilir"));
        }

        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            String fileName   = UUID.randomUUID() + ".webp";
            File   outputFile = new File(UPLOAD_DIR + fileName);

            ImmutableImage.loader()
                    .fromStream(file.getInputStream())
                    .max(1920, 1080)
                    .output(WebpWriter.DEFAULT.withQ(80), outputFile);

            log.info("Image uploaded and converted to WebP: {}", fileName);
            return ResponseEntity.ok(Map.of("url", "/uploads/" + fileName));

        } catch (Exception e) {
            log.error("Image upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Şəkil yüklənərkən xəta baş verdi"));
        }
    }
}