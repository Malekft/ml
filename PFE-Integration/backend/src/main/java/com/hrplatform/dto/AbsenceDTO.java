package com.hrplatform.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AbsenceDTO {
    private Long id;
    private Long employeId;
    private String employeNom;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String type;
    private Boolean justifiee;
    private LocalDateTime dateLimiteJustification;
    private String statut;
    private String justificatifUrl;
    private LocalDateTime dateJustification;
    private String email;
    private String avatar;
}
