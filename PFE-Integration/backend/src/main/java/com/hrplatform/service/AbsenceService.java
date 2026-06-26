package com.hrplatform.service;

import com.hrplatform.dto.AbsenceDTO;
import com.hrplatform.entity.Absence;
import com.hrplatform.entity.Employe;
import com.hrplatform.entity.User;
import com.hrplatform.repository.AbsenceRepository;
import com.hrplatform.repository.EmployeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.scheduling.annotation.Scheduled;

@Service @RequiredArgsConstructor
public class AbsenceService {
    private final AbsenceRepository absenceRepo;
    private final EmployeRepository employeRepo;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AbsenceDTO> findByEmployeId(Long employeId) {
        return absenceRepo.findByEmployeId(employeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AbsenceDTO addAbsence(Long employeId, LocalDateTime dateDebut, LocalDateTime dateFin, String type) {
        Employe emp = employeRepo.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        Absence absence = Absence.builder()
                .employe(emp)
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .type(type != null ? type : "ABSENCE_IRREGULIERE")
                .justifiee(false)
                .dateLimiteJustification(LocalDateTime.now().plusHours(48))
                .build();

        Absence saved = absenceRepo.save(absence);
        
        // Notify user
        notificationService.createNotification(
            emp.getId(), 
            null, 
            "Une absence irrégulière a été enregistrée le " + dateDebut.toLocalDate() + ". Veuillez la justifier sous 48h.", 
            "INTERNE"
        );

        return toDTO(saved);
    }

    @Transactional
    public AbsenceDTO justifyAbsence(Long id, String fileUrl) {
        Absence a = absenceRepo.findById(id).orElseThrow();
        a.setJustificatifUrl(fileUrl);
        a.setStatut("EN_ATTENTE");
        a.setDateJustification(LocalDateTime.now());
        return toDTO(absenceRepo.save(a));
    }

    @Transactional
    public AbsenceDTO validateJustification(Long id, boolean approved) {
        Absence a = absenceRepo.findById(id).orElseThrow();
        if (approved) {
            a.setJustifiee(true);
            a.setStatut("JUSTIFIEE");
            
            // Notify user
            notificationService.createNotification(
                a.getEmploye().getId(),
                null,
                "Votre justification pour l'absence du " + a.getDateDebut().toLocalDate() + " a été validée.",
                "INTERNE"
            );
        } else {
            a.setJustifiee(false);
            a.setStatut("TEMPORAIRE"); // Back to temporary, user can try again maybe
            a.setJustificatifUrl(null);
            
            notificationService.createNotification(
                a.getEmploye().getId(),
                null,
                "Votre justification pour l'absence du " + a.getDateDebut().toLocalDate() + " a été refusée.",
                "INTERNE"
            );
        }
        return toDTO(absenceRepo.save(a));
    }

    public AbsenceDTO toDTO(Absence a) {
        return AbsenceDTO.builder()
                .id(a.getId())
                .employeId(a.getEmploye().getId())
                .employeNom(a.getEmploye().getPrenom() + " " + a.getEmploye().getNom())
                .dateDebut(a.getDateDebut())
                .dateFin(a.getDateFin())
                .type(a.getType())
                .justifiee(a.getJustifiee())
                .dateLimiteJustification(a.getDateLimiteJustification())
                .statut(a.getStatut())
                .justificatifUrl(a.getJustificatifUrl())
                .dateJustification(a.getDateJustification())
                .email(a.getEmploye().getEmail())
                .avatar(a.getEmploye().getAvatar() != null ? a.getEmploye().getAvatar() : User.generateAvatar(a.getEmploye().getEmail()))
                .build();
    }

    @Transactional(readOnly = true)
    public List<AbsenceDTO> findAll() {
        return absenceRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Scheduled(fixedRate = 60000) // Check every minute
    @Transactional
    public void checkAndSendReminders() {
        List<Absence> absences = absenceRepo.findAll().stream()
            .filter(a -> "TEMPORAIRE".equals(a.getStatut()) && !a.getJustifiee() && (a.getRappelEnvoye() == null || !a.getRappelEnvoye()))
            .collect(Collectors.toList());
            
        LocalDateTime now = LocalDateTime.now();
        for (Absence a : absences) {
            // Si la date limite est dans moins de 24h, ça veut dire qu'il s'est écoulé 24h depuis la création
            if (a.getDateLimiteJustification() != null && a.getDateLimiteJustification().minusHours(24).isBefore(now)) {
                notificationService.createNotification(
                    a.getEmploye().getId(),
                    null,
                    "⚠️ Rappel : Il vous reste moins de 24h pour justifier votre absence du " + a.getDateDebut().toLocalDate() + ". (5 jours seront déduits en cas de non justification)",
                    "INTERNE"
                );
                a.setRappelEnvoye(true);
                absenceRepo.save(a);
            }
        }
    }
}
