package com.hrplatform.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor @Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@hrplatform.com}")
    private String fromAddress;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    /**
     * Send an HTML email asynchronously so it doesn't block the main thread.
     * Catches ALL exceptions so a mail failure never propagates.
     */
    @Async
    public void sendEmail(String to, String subject, String htmlBody) {
        if (!mailEnabled) {
            log.info("📧 Email désactivé – mail ignoré vers {} : {}", to, subject);
            return;
        }
        try {
            log.debug("📧 Tentative d'envoi email à {} – sujet: {}", to, subject);
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(msg);
            log.info("✉️  Email envoyé avec succès à {} – {}", to, subject);
        } catch (Exception e) {
            // Catch ALL exceptions (MessagingException, MailAuthenticationException, etc.)
            log.error("❌ Échec envoi email à {} : {} – {}", to, e.getClass().getSimpleName(), e.getMessage());
        }
    }

    /**
     * Build a styled HTML notification email.
     */
    public String buildNotificationHtml(String recipientName, String notificationMessage, String type) {
        String typeColor;
        String typeLabel;
        switch (type) {
            case "SLA" -> { typeColor = "#ef4444"; typeLabel = "⚠️ Alerte SLA"; }
            case "SYSTEME" -> { typeColor = "#8b5cf6"; typeLabel = "⚙️ Système"; }
            case "EMAIL" -> { typeColor = "#3b82f6"; typeLabel = "📧 Email"; }
            default -> { typeColor = "#06b6d4"; typeLabel = "🔔 Notification"; }
        }

        return """
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#0f172a 0%%,#1e293b 100%%);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                      💼 HR Platform
                    </h1>
                    <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Plateforme de Gestion RH Intelligente</p>
                  </td>
                </tr>
                <!-- Badge -->
                <tr>
                  <td style="padding:24px 40px 0;">
                    <span style="display:inline-block;background:%s;color:#fff;font-size:12px;font-weight:600;padding:4px 14px;border-radius:20px;">
                      %s
                    </span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:20px 40px 32px;">
                    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Bonjour <strong>%s</strong>,</p>
                    <div style="background:#f8fafc;border-left:4px solid %s;border-radius:8px;padding:16px 20px;margin:16px 0;">
                      <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">%s</p>
                    </div>
                    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">
                      Connectez-vous à votre espace pour plus de détails.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;color:#94a3b8;font-size:11px;">
                      © 2026 HR Platform — Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(typeColor, typeLabel, recipientName, typeColor, notificationMessage);
    }
}
