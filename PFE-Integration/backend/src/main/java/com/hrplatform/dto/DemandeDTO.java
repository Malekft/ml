package com.hrplatform.dto;

import com.hrplatform.enums.StatutDemande;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DemandeDTO {
    private Long id;
    private Long employeId;
    private String employeNom;
    private String employePrenom;
    private StatutDemande statut;
    private LocalDateTime dateCreation;
    private LocalDateTime dateTraitement;
    private String motifRefus;
    // Congé fields
    private Long typeCongeId;
    private String typeCongeNom;
    private Long sousTypeCongeId;
    private String sousTypeCongeNom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer dureeJours;
    private String motif;
    private Integer nbHeures;
    private LocalDate dateTravail;
    private String justificatifUrl;
    private String email;
    private String avatar;
}
