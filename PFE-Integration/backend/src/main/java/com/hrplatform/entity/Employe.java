package com.hrplatform.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDate;
import java.util.List;

@Entity @Table(name = "employes")
@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder
@EqualsAndHashCode(callSuper = true)
@PrimaryKeyJoinColumn(name = "user_id")
public class Employe extends User {

    @Column(nullable = false, unique = true, length = 50) private String matricule;
    @Column(nullable = false, length = 150) private String poste;
    @Column(name = "date_embauche", nullable = false) private LocalDate dateEmbauche;

    @Column(length = 100) private String bureau;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", referencedColumnName = "id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private User manager;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "employe_competences", joinColumns = @JoinColumn(name = "employe_id"))
    @Column(name = "competence")
    private List<String> competences;

    @JsonIgnore
    @OneToOne(mappedBy = "employe", cascade = CascadeType.ALL)
    private SoldeConge soldeConge;


    @JsonIgnore
    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    private List<Demande> demandes;

    @JsonIgnore
    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    private List<Document> documents;

    @JsonIgnore
    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    private List<TicketSupport> tickets;

    @JsonIgnore
    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    private List<Absence> absences;

    @JsonIgnore
    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    private List<DemandeTravail> demandesTravail;




    // UML Methods (Placeholder for service layer or custom logic)
    public void soumettreDemande(Demande d) { /* Logic handled in service */ }
    public void consulterDemandes() { }
    public void televerserDocument(Document d) { }
}
