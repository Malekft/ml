package com.hrplatform.entity;

import com.hrplatform.enums.StatutDemande;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "demandes")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "type_demande")
@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public abstract class Demande {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    private Employe employe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par")
    private Administrateur traitePar;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    @Column(name = "motif_refus", length = 500)
    private String motifRefus;

    @Column(name = "motif", columnDefinition = "NVARCHAR(MAX)")
    private String motif;

    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL)
    private List<Document> documents;

    @OneToMany(mappedBy = "demande")
    private List<Notification> notifications;

    @PrePersist void onCreate() { if (dateCreation == null) dateCreation = LocalDateTime.now(); }
}
