package az.eticksystem.event;

import az.eticksystem.utils.PdfReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventReportController {

    private final PdfReportService pdfReportService;

    @GetMapping("/{eventId}/report/pdf")
    public ResponseEntity<byte[]> downloadPdfReport(@PathVariable String eventId) {
        log.info("PDF report requested for event: {}", eventId);
        byte[] pdfBytes = pdfReportService.generateEventReport(eventId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=report_" + eventId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}