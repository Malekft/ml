package com.hrplatform.dto;

import lombok.*;
import java.time.LocalDate;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class EmployeDTO {
    private Long id;
    private Long userId;
    private String matricule;
    private String poste;
    private LocalDate dateEmbauche;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String bureau;
    private String manager;
    private Long managerId;
    private java.util.List<String> competences;
    private Integer joursRestants;
    private Integer joursAccumules;
    private String avatar;
    private Boolean isOnline;
    private java.util.List<DocumentDTO> documents;
}
