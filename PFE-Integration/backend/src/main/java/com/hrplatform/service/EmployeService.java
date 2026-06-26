package com.hrplatform.service;

import com.hrplatform.dto.EmployeDTO;
import com.hrplatform.dto.DocumentDTO;
import com.hrplatform.entity.*;
import com.hrplatform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class EmployeService {
    private final EmployeRepository employeRepo;
    private final SoldeCongeRepository soldeRepo;
    private final DocumentRepository documentRepo;

    @Transactional(readOnly = true)
    public List<EmployeDTO> findAll() {
        return employeRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeDTO findById(Long id) {
        return toDTO(employeRepo.findById(id).orElseThrow(() -> new RuntimeException("Employé introuvable: " + id)));
    }

    @Transactional(readOnly = true)
    public EmployeDTO findByUserId(Long userId) {
        return toDTO(employeRepo.findById(userId).orElseThrow(() -> new RuntimeException("Employé introuvable")));
    }

    @Transactional
    public Employe save(Employe e) { return employeRepo.save(e); }

    @Transactional
    public void delete(Long id) { employeRepo.deleteById(id); }

    public EmployeDTO toDTO(Employe e) {
        var solde = soldeRepo.findByEmployeId(e.getId());

        return EmployeDTO.builder()
                .id(e.getId())
                .userId(e.getId()) // Same as ID in JOINED inheritance
                .matricule(e.getMatricule())
                .poste(e.getPoste())
                .dateEmbauche(e.getDateEmbauche())
                .nom(e.getNom())
                .prenom(e.getPrenom())
                .email(e.getEmail())
                .telephone(e.getTelephone())
                .bureau(e.getBureau())
                .manager(e.getManager() != null ? e.getManager().getPrenom() + " " + e.getManager().getNom() : null)
                .managerId(e.getManager() != null ? e.getManager().getId() : null)
                .competences(e.getCompetences() != null ? e.getCompetences() : java.util.List.of())
                .joursRestants(solde.map(SoldeConge::getJoursRestants).orElse(0))
                .joursAccumules(solde.map(SoldeConge::getJoursAccumules).orElse(0))
                .avatar(e.getAvatar() != null ? e.getAvatar() : User.generateAvatar(e.getEmail()))
                .documents(documentRepo.findByEmployeId(e.getId()).stream()
                        .map(doc -> DocumentDTO.builder()
                                .id(doc.getId())
                                .fileName(doc.getFileName())
                                .fileUrl(doc.getFileUrl())
                                .type(doc.getType().name())
                                .uploadedAt(doc.getUploadedAt())
                                .validated(doc.getValidated())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
