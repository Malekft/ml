package com.hrplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDate;

@Entity @Table(name = "demande_conge")
@PrimaryKeyJoinColumn(name = "demande_id")
@DiscriminatorValue("CONGE")
@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class DemandeConge extends Demande {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_conge_id", nullable = false)
    private TypeConge typeConge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_type_conge_id")
    private SousTypeConge sousTypeConge;

    @Column(name = "date_debut", nullable = false) private LocalDate dateDebut;
    @Column(name = "date_fin", nullable = false)   private LocalDate dateFin;
    @Column(name = "duree_jours", nullable = false) private Integer dureeJours;

    public void calculerDuree() {
        if (dateDebut != null && dateFin != null)
            this.dureeJours = (int)(dateDebut.until(dateFin, java.time.temporal.ChronoUnit.DAYS) + 1);
    }
}
