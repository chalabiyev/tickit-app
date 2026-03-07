package az.eticksystem.upload;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class ImageUploadService {

    private static final String UPLOAD_DIR = "uploads/";

    // Whitelist разрешённых MIME-типов — защита от загрузки .exe/.php под видом картинки
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final long MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

    public String saveImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Fayl seçilməyib");
        }

        // Проверка MIME-типа
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Yalnız şəkil faylları qəbul edilir (JPEG, PNG, WebP, GIF)");
        }

        // Проверка размера
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Faylın ölçüsü 20MB-dan çox ola bilməz");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Берём расширение только из оригинального имени, без path traversal
        String originalFilename = file.getOriginalFilename();
        String ext = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            String rawExt = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            // Разрешаем только безопасные расширения
            if (Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif").contains(rawExt)) {
                ext = rawExt;
            }
        }

        String uniqueFilename = UUID.randomUUID() + ext;

        // Normalize защищает от path traversal: uploads/../../etc/passwd
        Path filePath = uploadPath.resolve(uniqueFilename).normalize();
        if (!filePath.startsWith(uploadPath.toAbsolutePath())) {
            throw new SecurityException("Qeyri-qanuni fayl yolu");
        }

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        log.info("Image saved: {}", uniqueFilename);

        return "/uploads/" + uniqueFilename;
    }
}