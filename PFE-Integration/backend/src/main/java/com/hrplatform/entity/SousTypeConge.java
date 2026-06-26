package com.hrplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "sous_type_conge")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SousTypeConge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_conge_id", nullable = false)
    @JsonIgnore
    private TypeConge typeConge;

    @Column(nullable = false, length = 100) private String nom;
    @Builder.Default
    @Column(name = "max_jours", nullable = false) private Integer maxJours = 5;
}
