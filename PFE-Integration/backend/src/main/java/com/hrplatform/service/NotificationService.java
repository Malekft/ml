package com.hrplatform.service;

import com.hrplatform.dto.NotificationDTO;
import com.hrplatform.entity.*;
import com.hrplatform.enums.TypeNotification;
import com.hrplatform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class NotificationService {
    private final NotificationRepository notifRepo;
    private final UserRepository userRepo;
    private final DemandeRepository demandeRepo;
    private final org.springframework.scheduling.TaskScheduler taskScheduler;
    private final EmailService emailService;

    public List<NotificationDTO> findByUserId(Long userId) {
        return notifRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public long countUnread(Long userId) {
        return notifRepo.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long id) {
        notifRepo.findById(id).ifPresent(n -> { n.marquerCommeLu(); notifRepo.save(n); });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notifRepo.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void createNotification(Long userId, Long demandeId, String message, String type) {
        User user = userRepo.findById(userId).orElse(null);
        if (user == null) return;
        Demande demande = demandeId != null ? demandeRepo.findById(demandeId).orElse(null) : null;

        // Safely resolve the notification type – fallback to INTERNE for unknown values
        TypeNotification notifType;
        try {
            notifType = TypeNotification.valueOf(type);
        } catch (IllegalArgumentException e) {
            log.warn("Type de notification inconnu '{}', utilisation de INTERNE par défaut", type);
            notifType = TypeNotification.INTERNE;
        }

        Notification n = Notification.builder()
                .user(user).demande(demande)
                .message(message)
                .type(notifType)
                .isRead(false).build();
        notifRepo.save(n);

        log.debug("🔔 Notification créée pour userId={} – message: {}", userId, message);

        // ── Also send email notification (async, never blocks) ──
        sendEmailForNotification(user, message, type);
    }

    public void scheduleDelayedAdminNotification(Long targetUserId, Long demandeId, String message, String type) {
        taskScheduler.schedule(() -> {
            demandeRepo.findById(demandeId).ifPresent(d -> {
                if (d.getStatut() == com.hrplatform.enums.StatutDemande.EN_ATTENTE) {
                    createNotification(targetUserId, demandeId, message, type);
                }
            });
        }, java.time.Instant.now().plusSeconds(60));
    }

    /**
     * Send an email copy of every in-app notification.
     * This method catches all exceptions so a mail failure never breaks the notification flow.
     */
    private void sendEmailForNotification(User user, String message, String type) {
        try {
            String recipientName = user.getPrenom() + " " + user.getNom();
            String subject = buildSubject(message, type);
            String html = emailService.buildNotificationHtml(recipientName, message, type);
            emailService.sendEmail(user.getEmail(), subject, html);
        } catch (Exception e) {
            log.error("Échec préparation email pour {} : {}", user.getEmail(), e.getMessage());
        }
    }

    /**
     * Build a short, descriptive subject line for the email.
     */
    private String buildSubject(String message, String type) {
        String prefix = switch (type) {
            case "SLA" -> "[SLA] ";
            case "SYSTEME" -> "[Système] ";
            case "EMAIL" -> "[Info] ";
            default -> "[HR Platform] ";
        };
        String shortMsg = message.length() > 80 ? message.substring(0, 77) + "…" : message;
        return prefix + shortMsg;
    }

    public NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .userId(n.getUser().getId())
                .demandeId(n.getDemande() != null ? n.getDemande().getId() : null)
                .message(n.getMessage())
                .type(n.getType().name())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
