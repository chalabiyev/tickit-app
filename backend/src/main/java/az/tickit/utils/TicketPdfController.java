package az.tickit.utils;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketPdfController {

    @PostMapping("/generate-pdf")
    public ResponseEntity<byte[]> generatePdf(@RequestBody Map<String, Object> payload) {
        try (PDDocument document = new PDDocument()) {

            Map<String, Object> design = (Map<String, Object>) payload.get("design");
            List<Map<String, Object>> tickets = (List<Map<String, Object>>) payload.get("tickets");
            List<Map<String, Object>> elements = (List<Map<String, Object>>) design.get("elements");
            String bgColorHex = (String) design.getOrDefault("bgColor", "#09090b");

            // Ширина и высота билета (как на фронте)
            float canvasWidth = 360f;
            float canvasHeight = 640f;

            for (Map<String, Object> ticketData : tickets) {
                PDPage page = new PDPage(new PDRectangle(canvasWidth, canvasHeight));
                document.addPage(page);

                try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                    // Заливаем фон
                    contentStream.setNonStrokingColor(Color.decode(bgColorHex));
                    contentStream.addRect(0, 0, canvasWidth, canvasHeight);
                    contentStream.fill();

                    // Отрисовываем элементы
                    for (Map<String, Object> el : elements) {
                        String type = (String) el.get("type");
                        float x = Float.parseFloat(el.get("x").toString());
                        float originalY = Float.parseFloat(el.get("y").toString());
                        int fontSize = el.get("fontSize") != null ? Integer.parseInt(el.get("fontSize").toString()) : 16;

                        // Переворачиваем Y для PDF
                        float y = canvasHeight - originalY - fontSize;

                        if ("text".equals(type)) {
                            String rawContent = (String) el.get("content");
                            String colorHex = (String) el.getOrDefault("color", "#ffffff");

                            // Заменяем смарт-теги на реальные данные
                            String text = fillTags(rawContent, ticketData);

                            contentStream.beginText();
                            // ВАЖНО: Стандартные шрифты PDFBox не поддерживают кириллицу/азербайджанский из коробки.
                            // Для старта юзаем стандартный, но потом сюда нужно будет подгрузить .ttf файл через PDType0Font.load()
                            contentStream.setFont(PDType1Font.HELVETICA_BOLD, fontSize);
                            contentStream.setNonStrokingColor(Color.decode(colorHex));
                            contentStream.newLineAtOffset(x > 0 ? x : 24, y); // Если x=0 (центр), делаем отступ
                            contentStream.showText(text.replaceAll("[^\\x00-\\x7F]", "")); // Временно чистим спецсимволы, чтобы не упало
                            contentStream.endText();

                        } else if ("qr".equals(type)) {
                            String qrData = (String) ticketData.get("qrData");
                            QRCodeWriter qrCodeWriter = new QRCodeWriter();
                            BitMatrix bitMatrix = qrCodeWriter.encode(qrData, BarcodeFormat.QR_CODE, fontSize, fontSize);
                            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

                            PDImageXObject pdImage = LosslessFactory.createFromImage(document, qrImage);
                            contentStream.drawImage(pdImage, x, y, fontSize, fontSize);
                        }
                    }
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "Tickets.pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(baos.toByteArray());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private String fillTags(String content, Map<String, Object> data) {
        if (content == null) return "";
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            content = content.replace("{{" + entry.getKey() + "}}", String.valueOf(entry.getValue()));
        }
        return content;
    }
}