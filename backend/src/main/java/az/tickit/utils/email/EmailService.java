package az.tickit.utils.email;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendTicketWithAttachment(String to, String subject, String body, byte[] pdfBytes, String fileName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("no-reply@eticksystem.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true означает, что можно использовать HTML

            // Добавляем наш PDF билет
            helper.addAttachment(fileName, new ByteArrayResource(pdfBytes));

            mailSender.send(message);
            System.out.println("Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }

    public void sendSimpleMessage(String to, String subject, String htmlContent) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper =
                    new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("no-reply@eticksystem.com"); // Твоя почта
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true — чтобы работал HTML

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email error: " + e.getMessage());
        }
    }
}