package com.hrplatform.service;

import com.hrplatform.dto.DemandeDTO;
import com.hrplatform.entity.*;
import com.hrplatform.enums.StatutDemande;
import com.hrplatform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DemandeService {
    private final DemandeRepository demandeRepo;
    private final DemandeCongeRepository congeRepo;
    private final EmployeRepository employeRepo;
    private final AdministrateurRepository adminRepo;
    private final TypeCongeRepository typeCongeRepo;
    private final SousTypeCongeRepository sousTypeRepo;
    private final SoldeCongeRepository soldeRepo;
    private final DocumentRepository documentRepo;
    private final NotificationService notifService;

    @Transactional(readOnly = true)
    public List<DemandeDTO> findAll() {
        return demandeRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DemandeDTO> findByEmployeId(Long eid) {
        return demandeRepo.findByEmployeId(eid).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DemandeDTO> findCongesByEmployeId(Long eid) {
        return congeRepo.findByEmployeId(eid).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DemandeDTO findById(Long id) {
        return toDTO(demandeRepo.findById(id).orElseThrow(() -> new RuntimeException("Demande introuvable")));
    }

    @Transactional
    public DemandeDTO create(DemandeDTO dto) {
        Employe emp = employeRepo.findById(dto.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));
        TypeConge tc = typeCongeRepo.findById(dto.getTypeCongeId())
                .orElseThrow(() -> new RuntimeException("Type congé introuvable"));

        // Rule 1: Delay check
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dto.getDateDebut());
        if (daysDiff < tc.getDelaiDemandeJours()) {
            throw new RuntimeException(
                    "Délai de demande non respecté (minimum " + tc.getDelaiDemandeJours() + " jours)");
        }

        long requestedDays = java.time.temporal.ChronoUnit.DAYS.between(dto.getDateDebut(), dto.getDateFin()) + 1;

        // Only check/deduct balance for Annual Leave. Other types (Maternity, etc.) have their own specific rules.
        if ("Congé annuel".equalsIgnoreCase(tc.getNom())) {
            SoldeConge solde = soldeRepo.findByEmployeId(emp.getId())
                    .orElseThrow(() -> new RuntimeException("Solde de congés introuvable"));
            if (solde.getJoursRestants() < requestedDays) {
                throw new RuntimeException("Solde de congés annuel insuffisant (" + solde.getJoursRestants() + " jours restants)");
            }
        }

        SousTypeConge stc = null;
        if (dto.getSousTypeCongeId() != null) {
            stc = sousTypeRepo.findById(dto.getSousTypeCongeId()).orElse(null);
        }

        DemandeConge cr = DemandeConge.builder()
                .employe(emp)
                .typeConge(tc)
                .sousTypeConge(stc)
                .dateDebut(dto.getDateDebut())
                .dateFin(dto.getDateFin())
                .motif(dto.getMotif())
                .statut(StatutDemande.EN_ATTENTE)
                .build();
        cr.calculerDuree();
        cr = congeRepo.save(cr);

        // Notify admin in-app (delayed 60s)
        notifService.scheduleDelayedAdminNotification(1L, cr.getId(),
                "Nouvelle demande de congé (" + tc.getNom() + ") de " + emp.getPrenom() + " " + emp.getNom(),
                "INTERNE");

        if (dto.getJustificatifUrl() != null) {
            Document doc = Document.builder()
                    .employe(emp)
                    .demande(cr)
                    .fileName("Justificatif_" + tc.getNom())
                    .fileUrl(dto.getJustificatifUrl())
                    .type(com.hrplatform.enums.TypeDocument.AUTRE)
                    .build();
            doc = documentRepo.save(doc);
            cr.setDocuments(java.util.List.of(doc));
        }

        return toDTO(cr);
    }

    @Transactional
    public DemandeDTO approve(Long id, Long adminId) {
        Demande d = demandeRepo.findById(id).orElseThrow();
        Administrateur admin = adminRepo.findById(adminId).orElseThrow();
        d.setStatut(StatutDemande.APPROUVEE);
        d.setDateTraitement(LocalDateTime.now());
        d.setTraitePar(admin);
        demandeRepo.save(d);
        // Deduct leave balance ONLY if it's Annual Leave
        if (d instanceof DemandeConge cr && "Congé annuel".equalsIgnoreCase(cr.getTypeConge().getNom())) {
            soldeRepo.findByEmployeId(d.getEmploye().getId()).ifPresent(s -> {
                s.mettreAJourSolde(cr.getDureeJours());
                soldeRepo.save(s);
            });
        }
        notifService.createNotification(d.getEmploye().getId(), id,
                "Votre demande de congé a été approuvée", "INTERNE");
        return toDTO(d);
    }

    @Transactional
    public DemandeDTO reject(Long id, Long adminId, String motif) {
        Demande d = demandeRepo.findById(id).orElseThrow();
        Administrateur admin = adminRepo.findById(adminId).orElseThrow();
        d.setStatut(StatutDemande.REFUSEE);
        d.setDateTraitement(LocalDateTime.now());
        d.setTraitePar(admin);
        d.setMotifRefus(motif);
        demandeRepo.save(d);
        notifService.createNotification(d.getEmploye().getId(), id,
                "Votre demande de congé a été refusée: " + motif, "INTERNE");
        return toDTO(d);
    }

    @Transactional
    public void cancel(Long id, Long employeId) {
        Demande d = demandeRepo.findById(id).orElseThrow(() -> new RuntimeException("Demande introuvable"));
        if (!d.getEmploye().getId().equals(employeId)) {
            throw new RuntimeException("Action non autorisée");
        }
        if (d.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RuntimeException("Seules les demandes en attente peuvent être annulées");
        }
        d.setStatut(StatutDemande.ANNULEE);
        d.setDateTraitement(LocalDateTime.now());
        demandeRepo.save(d);
    }

    public DemandeDTO toDTO(Demande d) {
        DemandeDTO dto = DemandeDTO.builder()
                .id(d.getId())
                .employeId(d.getEmploye().getId())
                .employeNom(d.getEmploye().getNom())
                .employePrenom(d.getEmploye().getPrenom())
                .statut(d.getStatut())
                .dateCreation(d.getDateCreation())
                .dateTraitement(d.getDateTraitement())
                .motifRefus(d.getMotifRefus())
                .motif(d.getMotif())
                .email(d.getEmploye().getEmail())
                .avatar(d.getEmploye().getAvatar() != null ? d.getEmploye().getAvatar() : User.generateAvatar(d.getEmploye().getEmail()))
                .build();

        if (d instanceof DemandeConge cr) {
            dto.setTypeCongeId(cr.getTypeConge() != null ? cr.getTypeConge().getId() : null);
            dto.setTypeCongeNom(cr.getTypeConge() != null ? cr.getTypeConge().getNom() : null);
            dto.setSousTypeCongeId(cr.getSousTypeConge() != null ? cr.getSousTypeConge().getId() : null);
            dto.setSousTypeCongeNom(cr.getSousTypeConge() != null ? cr.getSousTypeConge().getNom() : null);
            dto.setDateDebut(cr.getDateDebut());
            dto.setDateFin(cr.getDateFin());
            dto.setDureeJours(cr.getDureeJours());
        } else if (d instanceof DemandeTravail dt) {
            dto.setNbHeures(dt.getNbHeures());
            dto.setDateTravail(dt.getDateTravail());
        }

        if (d.getDocuments() != null && !d.getDocuments().isEmpty()) {
            dto.setJustificatifUrl(d.getDocuments().get(0).getFileUrl());
        }
        return dto;
    }
}
