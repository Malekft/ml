package com.hrplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity @Table(name = "autorisation_sortie")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AutorisationSortie {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    private Employe employe;

    @Column(nullable = false)
    private Integer heures;

    @Column(nullable = false)
    private LocalDate dateAutorisation;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime dateSaisie = LocalDateTime.now();
}
