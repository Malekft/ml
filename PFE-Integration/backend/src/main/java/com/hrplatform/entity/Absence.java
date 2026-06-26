package com.hrplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "absences")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Absence {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    private Employe employe;

    @Column(name = "date_debut", nullable = false) private LocalDateTime dateDebut;
    @Column(name = "date_fin", nullable = false)   private LocalDateTime dateFin;
    
    @Builder.Default
    @Column(nullable = false, length = 50) private String type = "ABSENCE_IRREGULIERE";

    @Builder.Default
    @Column(nullable = false) private Boolean justifiee = false;

    @Column(name = "date_limite_justification") private LocalDateTime dateLimiteJustification;
    
    @Builder.Default
    @Column(name = "statut", length = 20) private String statut = "TEMPORAIRE"; // TEMPORAIRE, EN_ATTENTE, JUSTIFIEE, DEFINITIVE

    @Column(name = "justificatif_url") private String justificatifUrl;
    @Column(name = "date_justification") private LocalDateTime dateJustification;
    
    @Builder.Default
    @Column(name = "rappel_envoye") private Boolean rappelEnvoye = false;
}
