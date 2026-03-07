package az.eticksystem.utils;

import az.eticksystem.event.Event;
import az.eticksystem.event.EventRepository;
import az.eticksystem.order.Order;
import az.eticksystem.order.OrderRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfReportService {

    private final OrderRepository orderRepository;
    private final EventRepository eventRepository;

    public byte[] generateEventReport(String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tədbir tapılmadı"));

        List<Order> orders = orderRepository.findByEventId(eventId);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 30, 30, 40, 40);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            BaseFont bf;
            try {
                bf = BaseFont.createFont("fonts/arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception e) {
                log.warn("arial.ttf not found, using fallback font");
                bf = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            }

            Font fontTitle     = new Font(bf, 18, Font.BOLD,   new Color(15, 23, 42));
            Font fontSub       = new Font(bf, 11, Font.NORMAL,  new Color(100, 116, 139));
            Font fontTableHead = new Font(bf, 10, Font.BOLD,   Color.WHITE);
            Font fontCell      = new Font(bf,  9, Font.NORMAL);

            // Логотип
            try {
                Image logo = Image.getInstance(new ClassPathResource("static/logo.png").getURL());
                logo.scaleToFit(90, 35);
                document.add(logo);
            } catch (Exception e) {
                log.warn("Logo not found, using text fallback");
                document.add(new Paragraph("eticksystem",
                        new Font(bf, 14, Font.BOLD, new Color(59, 130, 246))));
            }

            // Заголовок
            Paragraph title = new Paragraph("TƏDBİR ÜZRƏ HESABAT", fontTitle);
            title.setSpacingBefore(15);
            document.add(title);
            document.add(new Paragraph("Tədbir: " + event.getTitle(), fontSub));
            document.add(new Chunk("\n"));

            // KPI блок
            double totalRev = orders.stream()
                    .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                    .sum();
            PdfPTable kpiTable = new PdfPTable(2);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(20);
            kpiTable.addCell(createKpiCell("Ümumi Gəlir",      totalRev + " AZN", bf));
            kpiTable.addCell(createKpiCell("Satılmış Biletlər", orders.size() + " ədəd", bf));
            document.add(kpiTable);

            // Таблица заказов
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{16, 26, 18, 8, 16, 16});

            String[] headers = {"Sifariş ID", "Müştəri", "Telefon", "Say", "Məbləğ", "Status"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontTableHead));
                cell.setBackgroundColor(new Color(59, 130, 246));
                cell.setPadding(10);
                cell.setBorderColor(new Color(226, 232, 240));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            for (Order o : orders) {
                String shortId = o.getId() != null && o.getId().length() > 6
                        ? o.getId().substring(0, 8).toUpperCase() : o.getId();

                table.addCell(createDataCell("#" + shortId, fontCell, Element.ALIGN_CENTER));

                String customerInfo = (o.getCustomerName()  != null ? o.getCustomerName()  : "") +
                        (o.getCustomerEmail() != null ? "\n" + o.getCustomerEmail() : "");
                table.addCell(createDataCell(customerInfo, fontCell, Element.ALIGN_LEFT));

                table.addCell(createDataCell(
                        o.getCustomerPhone() != null ? o.getCustomerPhone() : "-",
                        fontCell, Element.ALIGN_CENTER));

                int qty = o.getTickets() != null ? o.getTickets().size() : 1;
                table.addCell(createDataCell(String.valueOf(qty), fontCell, Element.ALIGN_CENTER));

                table.addCell(createDataCell(
                        (o.getTotalAmount() != null ? o.getTotalAmount() : 0.0) + " ₼",
                        fontCell, Element.ALIGN_RIGHT));

                PdfPCell statusCell = createDataCell(
                        o.getStatus() != null ? o.getStatus() : "N/A",
                        fontCell, Element.ALIGN_CENTER);
                if ("SUCCESS".equals(o.getStatus()) || "Ödənilib".equals(o.getStatus())) {
                    statusCell.getPhrase().getFont().setColor(new Color(22, 163, 74));
                }
                table.addCell(statusCell);
            }

            document.add(table);
            document.close();
            log.info("PDF report generated for event: {}", eventId);

        } catch (Exception e) {
            log.error("PDF generation failed for event {}: {}", eventId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "PDF yaradılarkən xəta baş verdi");
        }

        return baos.toByteArray();
    }

    private PdfPCell createKpiCell(String label, String val, BaseFont bf) {
        PdfPCell cell = new PdfPCell();
        cell.addElement(new Phrase(label, new Font(bf, 8, Font.NORMAL, Color.GRAY)));
        cell.addElement(new Phrase(val,   new Font(bf, 13, Font.BOLD, new Color(59, 130, 246))));
        cell.setPadding(12);
        cell.setBackgroundColor(new Color(248, 250, 252));
        cell.setBorderColor(new Color(226, 232, 240));
        return cell;
    }

    private PdfPCell createDataCell(String txt, Font f, int align) {
        PdfPCell c = new PdfPCell(new Phrase(txt, f));
        c.setPadding(8);
        c.setBorderColor(new Color(241, 245, 249));
        c.setHorizontalAlignment(align);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return c;
    }
}