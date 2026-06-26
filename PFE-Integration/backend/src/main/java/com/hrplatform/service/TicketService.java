package com.hrplatform.service;

import com.hrplatform.dto.TicketDTO;
import com.hrplatform.entity.*;
import com.hrplatform.enums.*;
import com.hrplatform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class TicketService {
    private final TicketSupportRepository ticketRepo;
    private final EmployeRepository employeRepo;
    private final DocumentRepository documentRepo;
    private final NotificationService notificationService;
    private final AdministrateurRepository adminRepo;

    @Transactional(readOnly = true)
    public List<TicketDTO> findAll() {
        return ticketRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> findByEmployeId(Long employeId) {
        return ticketRepo.findByEmployeId(employeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TicketDTO findById(Long id) {
        return toDTO(ticketRepo.findById(id).orElseThrow(() -> new RuntimeException("Ticket introuvable")));
    }

    @Transactional
    public TicketDTO create(TicketDTO dto) {
        Employe emp = employeRepo.findById(dto.getEmployeId()).orElseThrow();
        TicketSupport t = TicketSupport.builder()
                .employe(emp)
                .titre(dto.getTitre())
                .description(dto.getDescription())
                .categorie(dto.getCategorie())
                .priorite(dto.getPriorite() != null ? dto.getPriorite() : Priorite.MOYENNE)
                .statut(StatutDemande.EN_ATTENTE)
                .build();
        
        TicketSupport saved = ticketRepo.save(t);

        if (dto.getFileUrl() != null) {
            Document doc = Document.builder()
                    .employe(emp)
                    .demande(saved)
                    .fileName("Capture_" + dto.getTitre())
                    .fileUrl(dto.getFileUrl())
                    .type(TypeDocument.AUTRE)
                    .build();
            documentRepo.save(doc);
            saved.setDocuments(java.util.List.of(doc));
        }

        // Notify Admins (delayed 60s)
        adminRepo.findAll().stream().findFirst().ifPresent(admin -> {
            String msg = "Nouveau ticket de support (#" + saved.getId() + ") soumis par " + emp.getPrenom() + " " + emp.getNom() + " : " + saved.getTitre();
            notificationService.scheduleDelayedAdminNotification(admin.getId(), saved.getId(), msg, "INTERNE");
        });

        return toDTO(saved);
    }

    @Transactional
    public TicketDTO updateStatus(Long id, StatutDemande statut) {
        TicketSupport t = ticketRepo.findById(id).orElseThrow();
        t.setStatut(statut);
        if (StatutDemande.RESOLU.equals(statut) || StatutDemande.FERME.equals(statut))
            t.setDateTraitement(LocalDateTime.now());
        
        TicketSupport saved = ticketRepo.save(t);
        
        // Notify user
        String msg = "Votre ticket #" + id + " est passé au statut : " + statut;
        notificationService.createNotification(t.getEmploye().getId(), null, msg, "INTERNE");

        return toDTO(saved);
    }

    @Transactional
    public void delete(Long id) { ticketRepo.deleteById(id); }

    public TicketDTO toDTO(TicketSupport t) {
        return TicketDTO.builder()
                .id(t.getId())
                .employeId(t.getEmploye().getId())
                .employeNom(t.getEmploye().getPrenom() + " " + t.getEmploye().getNom())
                .titre(t.getTitre())
                .description(t.getDescription())
                .categorie(t.getCategorie())
                .priorite(t.getPriorite())
                .statut(t.getStatut())
                .dateCreation(t.getDateCreation())
                .dateTraitement(t.getDateTraitement())
                .slaDeadline(t.getSlaDeadline())
                .fileUrl((t.getDocuments() != null && !t.getDocuments().isEmpty()) ? t.getDocuments().get(0).getFileUrl() : null)
                .avatar(t.getEmploye().getAvatar() != null ? t.getEmploye().getAvatar() : User.generateAvatar(t.getEmploye().getEmail()))
                .email(t.getEmploye().getEmail())
                .build();
    }
}
