package com.hrplatform.controller;

import com.hrplatform.dto.*;
import com.hrplatform.entity.User;
import com.hrplatform.repository.UserRepository;
import com.hrplatform.service.AuthService;
import com.hrplatform.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController @RequestMapping("/auth") @RequiredArgsConstructor @Slf4j
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // In-memory store for reset codes: email -> {code, expiry}
    private static final ConcurrentHashMap<String, ResetEntry> resetCodes = new ConcurrentHashMap<>();

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() { return ResponseEntity.ok().build(); }

    /**
     * Step 1: User sends their email. We generate a 6-digit code and send it via email.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email requis"));
        }

        User user = userRepo.findByEmail(email.trim()).orElse(null);
        if (user == null) {
            // Don't reveal if the email exists or not (security best practice)
            return ResponseEntity.ok(Map.of("message", "Si cet email existe, un code de réinitialisation a été envoyé."));
        }

        // Generate a 6-digit code
        String code = String.valueOf(100000 + (int)(Math.random() * 900000));
        resetCodes.put(email.trim().toLowerCase(), new ResetEntry(code, LocalDateTime.now().plusMinutes(15)));

        // Send email with the code (async – fire and forget)
        try {
            String recipientName = user.getPrenom() + " " + user.getNom();
            String html = buildResetEmail(recipientName, code);
            emailService.sendEmail(user.getEmail(), "[HR Platform] Code de réinitialisation", html);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du code de reset: {}", e.getMessage());
        }

        log.info("🔑 Code de réinitialisation généré pour {}", email);
        return ResponseEntity.ok(Map.of("message", "Si cet email existe, un code de réinitialisation a été envoyé."));
    }

    /**
     * Step 2: Verify the code only (without resetting password yet).
     */
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email et code requis"));
        }

        String key = email.trim().toLowerCase();
        ResetEntry entry = resetCodes.get(key);
        if (entry == null || !entry.code.equals(code.trim())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Code invalide"));
        }
        if (entry.expiry.isBefore(LocalDateTime.now())) {
            resetCodes.remove(key);
            return ResponseEntity.badRequest().body(Map.of("error", "Code expiré. Veuillez en demander un nouveau."));
        }

        return ResponseEntity.ok(Map.of("message", "Code vérifié avec succès"));
    }

    /**
     * Step 3: User sends email + code + newPassword. We verify and update.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        String newPassword = body.get("newPassword");

        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tous les champs sont requis"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 6 caractères"));
        }

        String key = email.trim().toLowerCase();
        ResetEntry entry = resetCodes.get(key);
        if (entry == null || !entry.code.equals(code.trim())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Code invalide"));
        }
        if (entry.expiry.isBefore(LocalDateTime.now())) {
            resetCodes.remove(key);
            return ResponseEntity.badRequest().body(Map.of("error", "Code expiré. Veuillez en demander un nouveau."));
        }

        User user = userRepo.findByEmail(email.trim()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Utilisateur introuvable"));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(user);
        resetCodes.remove(key);

        log.info("✅ Mot de passe réinitialisé pour {}", email);
        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
    }

    private String buildResetEmail(String name, String code) {
        return """
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f172a 0%%,#1e293b 100%%);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">💼 HR Platform</h1>
                    <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Réinitialisation du mot de passe</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 40px;">
                    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Bonjour <strong>%s</strong>,</p>
                    <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
                      Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de vérification :
                    </p>
                    <div style="text-align:center;margin:24px 0;">
                      <div style="display:inline-block;background:#f8fafc;border:2px dashed #6366f1;border-radius:16px;padding:20px 40px;">
                        <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#6366f1;font-family:monospace;">%s</span>
                      </div>
                    </div>
                    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;text-align:center;">
                      ⏱ Ce code expire dans <strong>15 minutes</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;color:#94a3b8;font-size:11px;">© 2026 HR Platform — Email automatique</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(name, code);
    }

    // Inner record for storing reset entries
    private record ResetEntry(String code, LocalDateTime expiry) {}
}
