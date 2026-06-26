package com.hrplatform.service;

import com.hrplatform.dto.DemandeDTO;
import com.hrplatform.entity.DemandeTravail;
import com.hrplatform.entity.Employe;
import com.hrplatform.repository.DemandeTravailRepository;
import com.hrplatform.repository.EmployeRepository;
import com.hrplatform.repository.AdministrateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor @Transactional
public class DemandeTravailService {
    private final DemandeTravailRepository travailRepo;
    private final EmployeRepository employeRepo;
    private final NotificationService notificationService;
    private final AdministrateurRepository adminRepo;

    public List<DemandeDTO> findByEmployeId(Long employeId) {
        return travailRepo.findByEmployeId(employeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DemandeDTO> findAll() {
        return travailRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DemandeDTO create(DemandeDTO dto) {
        Employe emp = employeRepo.findById(dto.getEmployeId()).orElseThrow();
        DemandeTravail dt = DemandeTravail.builder()
                .employe(emp)
                .dateTravail(dto.getDateTravail())
                .nbHeures(dto.getNbHeures())
                .motif(dto.getMotif())
                .statut(dto.getStatut() != null ? dto.getStatut() : com.hrplatform.enums.StatutDemande.EN_ATTENTE)
                .build();
        
        DemandeTravail saved = travailRepo.save(dt);

        // Notify Admins (delayed 60s)
        adminRepo.findAll().stream().findFirst().ifPresent(admin -> {
            String msg = "Nouvelle demande de travail supplémentaire de " + emp.getPrenom() + " " + emp.getNom() + " (" + dt.getNbHeures() + "h)";
            notificationService.scheduleDelayedAdminNotification(admin.getId(), saved.getId(), msg, "INTERNE");
        });

        return toDTO(saved);
    }

    public DemandeDTO updateStatus(Long id, com.hrplatform.enums.StatutDemande newStatut) {
        DemandeTravail dt = travailRepo.findById(id).orElseThrow();
        dt.setStatut(newStatut);
        if (newStatut == com.hrplatform.enums.StatutDemande.APPROUVEE || newStatut == com.hrplatform.enums.StatutDemande.REFUSEE) {
            dt.setDateTraitement(java.time.LocalDateTime.now());
        }
        
        DemandeTravail saved = travailRepo.save(dt);
        
        // Notify user
        String msg = "Votre demande de travail supplémentaire du " + dt.getDateTravail() + " a été " + newStatut;
        notificationService.createNotification(dt.getEmploye().getId(), null, msg, "INTERNE");

        return toDTO(saved);
    }

    private DemandeDTO toDTO(DemandeTravail dt) {
        return DemandeDTO.builder()
                .id(dt.getId())
                .employeId(dt.getEmploye().getId())
                .employeNom(dt.getEmploye().getPrenom() + " " + dt.getEmploye().getNom())
                .employePrenom(dt.getEmploye().getPrenom())
                .statut(dt.getStatut())
                .dateCreation(dt.getDateCreation())
                .dateTraitement(dt.getDateTraitement())
                .dateTravail(dt.getDateTravail())
                .nbHeures(dt.getNbHeures())
                .motif(dt.getMotif())
                .motifRefus(dt.getMotifRefus())
                .avatar(dt.getEmploye().getAvatar())
                .build();
    }
}
