package az.tickit.upload;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class ImageUploadService {

    // Папка, куда будут сохраняться картинки
    private final String UPLOAD_DIR = "uploads/";

    public String saveImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Файл пуст!");
        }

        // 1. Создаем папку uploads, если её еще нет
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 2. Генерируем уникальное имя файла (чтобы юзеры не перезаписали файлы друг друга)
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

        // 3. Сохраняем файл на диск
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // 4. Возвращаем путь, по которому картинка будет доступна
        return "/uploads/" + uniqueFilename;
    }
}