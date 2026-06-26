package com.hrplatform.dto;

import com.hrplatform.enums.*;
import lombok.*;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class TicketDTO {
    private Long id;
    private Long employeId;
    private String employeNom;
    private String titre;
    private String description;
    private String categorie;
    private Priorite priorite;
    private StatutDemande statut;
    private LocalDateTime dateCreation;
    private LocalDateTime dateTraitement;
    private LocalDateTime slaDeadline;
    private String fileUrl;
    private String email;
    private String avatar;
}
