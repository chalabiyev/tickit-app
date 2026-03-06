package az.tickit.utils.email;

import az.tickit.utils.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // <-- ДОБАВЬ ЭТУ СТРОЧКУ
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send-ticket")
    public ResponseEntity<?> sendTicket(
            @RequestParam("file") MultipartFile file,
            @RequestParam("email") String email,
            @RequestParam("buyerName") String buyerName,
            @RequestParam("eventName") String eventName,
            @RequestParam("eventDate") String eventDate,
            @RequestParam("location") String location) {

        try {
            String subject = "Eticksystem: " + eventName + " sizin üçün biletiniz hazırdır!";

            // ИСПРАВЛЕННЫЙ HTML ШАБЛОН (все % заменены на %%)
            String htmlBody = """
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; color: #1e293b;">
                    <div style="background-color: #000000; padding: 30px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; letter-spacing: 4px; font-weight: 900; font-size: 22px;">ETICKSYSTEM</h2>
                    </div>
                    
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <h1 style="color: #0f172a; font-size: 26px; font-weight: 800; margin-bottom: 10px;">Salam, %s!</h1>
                        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Təbriklər! Sizin <b>%s</b> tədbiri üçün biletiniz uğurla rəsmiləşdirildi. Biletiniz bu e-poçta PDF formatında əlavə edilib.
                        </p>
                        
                        <div style="background-color: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 30px;">
                            <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Tədbir adı</p>
                            <p style="margin: 5px 0 20px 0; color: #0f172a; font-size: 20px; font-weight: 800;">%s</p>
                            
                            <table style="width: 100%%;"> <tr>
                                    <td style="width: 50%%; vertical-align: top;"> <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Vaxt</p>
                                        <p style="margin: 5px 0 0 0; color: #334155; font-size: 14px; font-weight: 600;">📅 %s</p>
                                    </td>
                                    <td style="width: 50%%; vertical-align: top;"> <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Məkan</p>
                                        <p style="margin: 5px 0 0 0; color: #334155; font-size: 14px; font-weight: 600;">📍 %s</p>
                                    </td>
                                </tr>
                            </table>
                        </div>
            
                        <p style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center; background-color: #fef2f2; padding: 12px; border-radius: 12px;">
                            ⚠️ QR-kodu girişdə nəzarətçiyə təqdim etməyi unutmayın!
                        </p>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 35px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                        <p style="margin: 0 0 15px 0; color: #0f172a; font-size: 15px; font-weight: 800; letter-spacing: 1px;">ETICKSYSTEM</p>
                        
                        <div style="margin-bottom: 20px;">
                            <a href="https://eticksystem.com" style="color: #64748b; text-decoration: none; font-size: 13px; margin: 0 10px;">eticksystem.com</a>
                            <span style="color: #cbd5e1;">|</span>
                            <a href="mailto:info@eticksystem.com" style="color: #64748b; text-decoration: none; font-size: 13px; margin: 0 10px;">info@eticksystem.com</a>
                        </div>
                        
                        <div style="margin-bottom: 25px;">
                            <a href="tel:+994557021133" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700;">
                                📞 +994 (55) 702 11 33
                            </a>
                        </div>
            
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                            <p style="color: #94a3b8; font-size: 11px; margin-top: 20px;">
                                © 2026 eticksystem.com. Bütün hüquqlar qorunur.
                            </p>
                        </div>
                    </div>
                </div>
                """.formatted(buyerName, eventName, eventName, eventDate, location);

            emailService.sendTicketWithAttachment(
                    email,
                    subject,
                    htmlBody,
                    file.getBytes(),
                    "Bilet_" + eventName.replace(" ", "_") + ".pdf"
            );

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Xəta: " + e.getMessage());
        }
    }
}
