package com.hrplatform.controller;

import com.hrplatform.dto.AutorisationSortieDTO;
import com.hrplatform.entity.AutorisationSortie;
import com.hrplatform.entity.Employe;
import com.hrplatform.entity.SoldeConge;
import com.hrplatform.entity.User;
import com.hrplatform.repository.AutorisationSortieRepository;
import com.hrplatform.repository.EmployeRepository;
import com.hrplatform.repository.SoldeCongeRepository;
import com.hrplatform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/autorisations")
@RequiredArgsConstructor
@Transactional
public class AutorisationSortieController {

    private final AutorisationSortieRepository autorisationRepo;
    private final EmployeRepository employeRepo;
    private final SoldeCongeRepository soldeRepo;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<AutorisationSortieDTO>> getAll() {
        return ResponseEntity.ok(autorisationRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList()));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<List<AutorisationSortieDTO>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(autorisationRepo.findByEmployeId(employeId).stream().map(this::toDTO).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<AutorisationSortieDTO> create(@RequestBody AutorisationSortieDTO dto) {
        Employe employe = employeRepo.findById(dto.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        SoldeConge solde = soldeRepo.findByEmployeId(employe.getId())
                .orElseThrow(() -> new RuntimeException("Solde de congé introuvable"));

        if (dto.getHeures() > 2) {
            throw new RuntimeException("La durée d'une autorisation ne peut pas dépasser 2 heures par jour.");
        }

        AutorisationSortie autorisation = AutorisationSortie.builder()
                .employe(employe)
                .heures(dto.getHeures())
                .dateAutorisation(dto.getDateAutorisation())
                .build();

        autorisation = autorisationRepo.save(autorisation);

        // Mettre à jour le solde
        solde.ajouterHeuresSortie(dto.getHeures());
        soldeRepo.save(solde);

        // Notify user
        String msg = "Une autorisation de sortie de " + dto.getHeures() + "h a été enregistrée pour le " + dto.getDateAutorisation();
        notificationService.createNotification(employe.getId(), null, msg, "INTERNE");

        return ResponseEntity.ok(toDTO(autorisation));
    }

    private AutorisationSortieDTO toDTO(AutorisationSortie a) {
        return AutorisationSortieDTO.builder()
                .id(a.getId())
                .employeId(a.getEmploye().getId())
                .employeNom(a.getEmploye().getPrenom() + " " + a.getEmploye().getNom())
                .employePrenom(a.getEmploye().getPrenom())
                .heures(a.getHeures())
                .dateAutorisation(a.getDateAutorisation())
                .dateSaisie(a.getDateSaisie())
                .email(a.getEmploye().getEmail())
                .avatar(a.getEmploye().getAvatar() != null ? a.getEmploye().getAvatar() : User.generateAvatar(a.getEmploye().getEmail()))
                .build();
    }
}
