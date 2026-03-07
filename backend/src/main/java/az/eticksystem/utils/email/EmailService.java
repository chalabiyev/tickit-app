package az.eticksystem.utils.email;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // Берём из application.properties — не хардкодим
    @Value("${spring.mail.username}")
    private String fromAddress;

    @Async // Email отправляется в отдельном потоке — не блокирует HTTP ответ
    public void sendTicketWithAttachment(String to, String subject, String body,
                                         byte[] pdfBytes, String fileName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            helper.addAttachment(fileName, new ByteArrayResource(pdfBytes));

            mailSender.send(message);
            log.info("Ticket email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send ticket email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Async
    public void sendSimpleMessage(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }
}