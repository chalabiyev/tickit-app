package az.eticksystem.utils;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@RestController
@RequestMapping("/api/v1/tickets")
public class TicketPdfController {

    private static final float CANVAS_WIDTH  = 360f;
    private static final float CANVAS_HEIGHT = 640f;

    @PostMapping("/generate-pdf")
    public ResponseEntity<byte[]> generatePdf(@RequestBody Map<String, Object> payload) {
        try (PDDocument document = new PDDocument()) {

            @SuppressWarnings("unchecked")
            Map<String, Object> design = (Map<String, Object>) payload.get("design");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> tickets = (List<Map<String, Object>>) payload.get("tickets");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> elements = (List<Map<String, Object>>) design.get("elements");

            String bgColorHex = (String) design.getOrDefault("bgColor", "#09090b");

            for (Map<String, Object> ticketData : tickets) {
                PDPage page = new PDPage(new PDRectangle(CANVAS_WIDTH, CANVAS_HEIGHT));
                document.addPage(page);

                try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                    // Фон
                    cs.setNonStrokingColor(Color.decode(bgColorHex));
                    cs.addRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    cs.fill();

                    for (Map<String, Object> el : elements) {
                        String type     = (String) el.get("type");
                        float  x        = Float.parseFloat(el.get("x").toString());
                        float  originalY = Float.parseFloat(el.get("y").toString());
                        int    fontSize  = el.get("fontSize") != null
                                ? Integer.parseInt(el.get("fontSize").toString()) : 16;
                        float y = CANVAS_HEIGHT - originalY - fontSize;

                        if ("text".equals(type)) {
                            String rawContent = (String) el.get("content");
                            String colorHex   = (String) el.getOrDefault("color", "#ffffff");
                            String text       = fillTags(rawContent, ticketData);

                            cs.beginText();
                            cs.setFont(PDType1Font.HELVETICA_BOLD, fontSize);
                            cs.setNonStrokingColor(Color.decode(colorHex));
                            cs.newLineAtOffset(x > 0 ? x : 24, y);
                            // Временно убираем не-ASCII — TODO: заменить на TTF шрифт для азербайджанских символов
                            cs.showText(text.replaceAll("[^\\x00-\\x7F]", ""));
                            cs.endText();

                        } else if ("qr".equals(type)) {
                            String qrData = (String) ticketData.get("qrData");
                            QRCodeWriter writer = new QRCodeWriter();
                            BitMatrix bitMatrix = writer.encode(qrData, BarcodeFormat.QR_CODE, fontSize, fontSize);
                            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
                            PDImageXObject pdImage = LosslessFactory.createFromImage(document, qrImage);
                            cs.drawImage(pdImage, x, y, fontSize, fontSize);
                        }
                    }
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            log.info("Ticket PDF generated: {} tickets", tickets.size());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "Tickets.pdf");

            return ResponseEntity.ok().headers(headers).body(baos.toByteArray());

        } catch (Exception e) {
            log.error("Ticket PDF generation failed: {}", e.getMessage(), e);
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