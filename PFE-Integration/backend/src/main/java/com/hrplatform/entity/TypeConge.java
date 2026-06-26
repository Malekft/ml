package com.hrplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity @Table(name = "type_conge")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TypeConge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100) private String nom;
    @Column(length = 100) private String categorie; // UML: categorie
    @Builder.Default
    @Column(name = "est_paye", nullable = false) private Boolean estPaye = true; // UML: estPaye

    @Builder.Default
    @Column(name = "max_days", nullable = false) private Integer maxDays = 30;

    @Builder.Default
    @Column(name = "justificatif_obligatoire", nullable = false)
    private Boolean justificatifObligatoire = false;

    @Builder.Default
    @Column(name = "delai_demande_jours", nullable = false)
    private Integer delaiDemandeJours = 1;

    @Builder.Default
    @Column(name = "delai_justification_heures", nullable = false)
    private Integer delaiJustificationHeures = 48;

    @OneToMany(mappedBy = "typeConge")
    private List<SousTypeConge> sousTypes;
}
