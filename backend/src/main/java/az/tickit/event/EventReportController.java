package az.tickit.event;

import az.tickit.utils.PdfReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
public class EventReportController {

    private final PdfReportService pdfReportService;

    public EventReportController(PdfReportService pdfReportService) {
        this.pdfReportService = pdfReportService;
    }

    @GetMapping("/{eventId}/report/pdf")
    public ResponseEntity<byte[]> downloadPdfReport(@PathVariable String eventId) {
        byte[] pdfBytes = pdfReportService.generateEventReport(eventId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report_" + eventId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}