package com.hrplatform.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "solde_conge")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SoldeConge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false, unique = true)
    private Employe employe;

    @Builder.Default
    @Column(name = "jours_accumules", nullable = false) private Integer joursAccumules = 0;
    @Builder.Default
    @Column(name = "jours_restants", nullable = false)  private Integer joursRestants = 0;
    @Column(nullable = false) private Integer annee;

    @Builder.Default
    @Column(name = "heures_sortie", nullable = false)
    private Integer heuresSortie = 0;

    public void mettreAJourSolde(int joursPris) {
        this.joursRestants = Math.max(0, this.joursRestants - joursPris);
    }

    public void ajouterHeuresSortie(int heures) {
        this.heuresSortie += heures;
    }
}
