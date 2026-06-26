package com.hrplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDate;

@Entity @Table(name = "demande_travail")
@PrimaryKeyJoinColumn(name = "demande_id")
@DiscriminatorValue("TRAVAIL")
@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class DemandeTravail extends Demande {

    @Column(name = "date_travail", nullable = false) 
    private LocalDate dateTravail;

    @Column(nullable = false) 
    private Integer nbHeures;
}
