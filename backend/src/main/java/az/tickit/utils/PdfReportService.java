package az.tickit.utils;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

import az.tickit.order.Order;
import az.tickit.event.Event;
import az.tickit.order.OrderRepository;
import az.tickit.event.EventRepository;

@Service
public class PdfReportService {

    private final OrderRepository orderRepository;
    private final EventRepository eventRepository;

    public PdfReportService(OrderRepository orderRepository, EventRepository eventRepository) {
        this.orderRepository = orderRepository;
        this.eventRepository = eventRepository;
    }

    public byte[] generateEventReport(String eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Tədbir tapılmadı"));
        List<Order> orders = orderRepository.findByEventId(eventId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 30, 30, 40, 40);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // ИСПРАВЛЕНИЕ: БЕЗОПАСНАЯ ЗАГРУЗКА ШРИФТА (Защита от падения 500)
            BaseFont bf;
            try {
                bf = BaseFont.createFont("fonts/arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception e) {
                System.out.println("Şrift tapılmadı (arial.ttf). Standart şrift istifadə olunur.");
                bf = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            }

            Font fontTitle = new Font(bf, 18, Font.BOLD, new Color(15, 23, 42));
            Font fontSub = new Font(bf, 11, Font.NORMAL, new Color(100, 116, 139));
            Font fontTableHead = new Font(bf, 10, Font.BOLD, Color.WHITE);
            Font fontCell = new Font(bf, 9, Font.NORMAL);

            // ЛОГОТИП
            try {
                Image logo = Image.getInstance(new ClassPathResource("static/logo.png").getURL());
                logo.scaleToFit(90, 35);
                document.add(logo);
            } catch (Exception e) {
                document.add(new Paragraph("e-ticksystem", new Font(bf, 14, Font.BOLD, new Color(59, 130, 246))));
            }

            // ШАПКА
            Paragraph p = new Paragraph("TƏDBİR ÜZRƏ HESABAT", fontTitle);
            p.setSpacingBefore(15);
            document.add(p);
            document.add(new Paragraph("Tədbir: " + event.getTitle(), fontSub));
            document.add(new Chunk("\n"));

            // KPI
            double totalRev = orders.stream().mapToDouble(Order::getTotalAmount).sum();
            PdfPTable kpiTable = new PdfPTable(2);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(20);
            kpiTable.addCell(createKpiCell("Ümumi Gəlir", totalRev + " AZN", bf));
            kpiTable.addCell(createKpiCell("Satılmış Biletlər", orders.size() + " ədəd", bf));
            document.add(kpiTable);

            // ТАБЛИЦА
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
                String shortId = o.getId() != null && o.getId().length() > 6 ? o.getId().substring(0, 8).toUpperCase() : o.getId();
                table.addCell(createDataCell("#" + shortId, fontCell, Element.ALIGN_CENTER));

                String customerInfo = (o.getCustomerName() != null ? o.getCustomerName() : "") +
                        (o.getCustomerEmail() != null ? "\n" + o.getCustomerEmail() : "");
                table.addCell(createDataCell(customerInfo, fontCell, Element.ALIGN_LEFT));

                table.addCell(createDataCell(o.getCustomerPhone() != null ? o.getCustomerPhone() : "-", fontCell, Element.ALIGN_CENTER));

                // ИСПРАВЛЕНИЕ: ЗАЩИТА ОТ NULL POINTER EXCEPTION В БИЛЕТАХ
                int qty = (o.getTickets() != null) ? o.getTickets().size() : 1;
                table.addCell(createDataCell(String.valueOf(qty), fontCell, Element.ALIGN_CENTER));

                table.addCell(createDataCell(o.getTotalAmount() + " ₼", fontCell, Element.ALIGN_RIGHT));

                PdfPCell statusCell = createDataCell(o.getStatus() != null ? o.getStatus() : "N/A", fontCell, Element.ALIGN_CENTER);
                if ("SUCCESS".equals(o.getStatus()) || "Ödənilib".equals(o.getStatus())) {
                    statusCell.getPhrase().getFont().setColor(new Color(22, 163, 74));
                }
                table.addCell(statusCell);
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace(); // Выведет точную ошибку в консоль сервера
            throw new RuntimeException("PDF yaradılarkən xəta: " + e.getMessage());
        }
        return baos.toByteArray();
    }

    private PdfPCell createKpiCell(String label, String val, BaseFont bf) {
        PdfPCell cell = new PdfPCell();
        cell.addElement(new Phrase(label, new Font(bf, 8, Font.NORMAL, Color.GRAY)));
        cell.addElement(new Phrase(val, new Font(bf, 13, Font.BOLD, new Color(59, 130, 246))));
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