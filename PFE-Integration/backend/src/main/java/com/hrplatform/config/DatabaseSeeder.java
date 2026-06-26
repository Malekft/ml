package com.hrplatform.config;

import com.hrplatform.entity.*;
import com.hrplatform.enums.*;
import com.hrplatform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

        private final UserRepository userRepo;
        private final EmployeRepository employeRepo;
        private final AdministrateurRepository adminRepo;
        private final TypeCongeRepository typeCongeRepo;
        private final SousTypeCongeRepository sousTypeCongeRepo;
        private final SoldeCongeRepository soldeRepo;
        private final AbsenceRepository absenceRepo;
        private final TicketSupportRepository ticketRepo;
        private final DemandeTravailRepository travailRepo;
        private final DemandeCongeRepository congeRepo;
        private final DocumentRepository documentRepo;
        private final AnnouncementRepository announcementRepo;
        private final AutorisationSortieRepository autoRepo;
        private final NotificationRepository notificationRepo;
        private final PasswordEncoder passwordEncoder;

        @Override
        @Transactional
        public void run(String... args) throws Exception {
                // Seulement s'il n'y a pas d'utilisateurs dans la base
                if (userRepo.count() == 0) {
                        String encodedPassword = passwordEncoder.encode("password");

                        // 1. Création de l'Administrateur
                        Administrateur admin = Administrateur.builder()
                                        .nom("Admin")
                                        .prenom("RH")
                                        .email("admin@hrplatform.com")
                                        .passwordHash(passwordEncoder.encode("123"))
                                        .role(Role.ADMIN)
                                        .fonction("Directrice RH")
                                        .avatar(User.generateAvatar("admin@hrplatform.com"))
                                        .build();
                        adminRepo.save(admin);

                        // 2. Création des Employés
                        Employe marie = Employe.builder()
                                        .nom("Dubois")
                                        .prenom("Marie")
                                        .email("marie.d@company.com")
                                        .passwordHash(passwordEncoder.encode("1234"))
                                        .role(Role.EMPLOYE)
                                        .telephone("+33 6 12 34 56 78")
                                        .matricule("EMP-001")
                                        .poste("Designer Senior")
                                        .dateEmbauche(LocalDate.of(2022, 1, 1))
                                        .bureau("Étage 4, B-402")
                                        .manager(admin)
                                        .competences(List.of("Figma", "UI/UX Design", "Adobe Creative Suite",
                                                        "Design System"))
                                        .avatar(User.generateAvatar("marie.d@company.com"))
                                        .build();

                        Employe jean = Employe.builder()
                                        .nom("Martin")
                                        .prenom("Jean")
                                        .email("jean.m@company.com")
                                        .passwordHash(passwordEncoder.encode("12345"))
                                        .role(Role.EMPLOYE)
                                        .telephone("+33 6 23 45 67 89")
                                        .matricule("EMP-002")
                                        .poste("Graphiste 3D")
                                        .dateEmbauche(LocalDate.of(2021, 6, 1))
                                        .bureau("Étage 2, G-210")
                                        .manager(admin)
                                        .competences(List.of("Blender", "Maya", "3D Animation", "Unity"))
                                        .avatar(User.generateAvatar("jean.m@company.com"))
                                        .build();

                        Employe sophie = Employe.builder()
                                        .nom("Bernard")
                                        .prenom("Sophie")
                                        .email("sophie.b@company.com")
                                        .passwordHash(passwordEncoder.encode("123456"))
                                        .role(Role.EMPLOYE)
                                        .telephone("+33 6 34 56 78 90")
                                        .matricule("EMP-003")
                                        .poste("Illustrateur")
                                        .dateEmbauche(LocalDate.of(2023, 1, 15))
                                        .bureau("Étage 3, Créa-3")
                                        .manager(admin)
                                        .competences(List.of("Illustration Numérique", "Photoshop", "Procreate",
                                                        "Storyboarding"))
                                        .avatar(User.generateAvatar("sophie.b@company.com"))
                                        .build();

                        employeRepo.saveAll(List.of(marie, jean, sophie));

                        // 3. Création des Soldes de Congés
                        SoldeConge soldeMarie = SoldeConge.builder().employe(marie).joursAccumules(24).joursRestants(18)
                                        .annee(2026)
                                        .build();
                        SoldeConge soldeJean = SoldeConge.builder().employe(jean).joursAccumules(24).joursRestants(12)
                                        .annee(2026)
                                        .build();
                        SoldeConge soldeSophie = SoldeConge.builder().employe(sophie).joursAccumules(24)
                                        .joursRestants(8)
                                        .annee(2026).build();
                        soldeRepo.saveAll(List.of(soldeMarie, soldeJean, soldeSophie));

                        // 3b. Création des Documents pour le Coffre-fort numérique
                        Document fichePaie = Document.builder()
                                        .employe(marie)
                                        .fileName("Fiche de paie - Mars 2026.pdf")
                                        .fileUrl("/documents/dummy_paie.pdf")
                                        .type(TypeDocument.FICHE_PAIE)
                                        .uploadedAt(LocalDateTime.now().minusDays(15))
                                        .validated(true)
                                        .build();

                        Document contrat = Document.builder()
                                        .employe(marie)
                                        .fileName("Contrat de travail initial.pdf")
                                        .fileUrl("/documents/dummy_contrat.pdf")
                                        .type(TypeDocument.CONTRAT_TRAVAIL)
                                        .uploadedAt(LocalDateTime.now().minusYears(2))
                                        .validated(true)
                                        .build();

                        documentRepo.saveAll(List.of(fichePaie, contrat));

                        Document fichePaieJ = Document.builder().employe(jean).fileName("Fiche de paie - Mars 2026.pdf")
                                        .fileUrl("/docs/p.pdf").type(TypeDocument.FICHE_PAIE)
                                        .uploadedAt(LocalDateTime.now().minusDays(15)).validated(true).build();
                        Document contratJ = Document.builder().employe(jean).fileName("Contrat de travail initial.pdf")
                                        .fileUrl("/docs/c.pdf").type(TypeDocument.CONTRAT_TRAVAIL)
                                        .uploadedAt(LocalDateTime.now().minusYears(1)).validated(true).build();
                        documentRepo.saveAll(List.of(fichePaieJ, contratJ));

                        Document fichePaieS = Document.builder().employe(sophie)
                                        .fileName("Fiche de paie - Mars 2026.pdf").fileUrl("/docs/p.pdf")
                                        .type(TypeDocument.FICHE_PAIE).uploadedAt(LocalDateTime.now().minusDays(15))
                                        .validated(true).build();
                        Document contratS = Document.builder().employe(sophie)
                                        .fileName("Contrat de travail initial.pdf").fileUrl("/docs/c.pdf")
                                        .type(TypeDocument.CONTRAT_TRAVAIL)
                                        .uploadedAt(LocalDateTime.now().minusYears(3)).validated(true).build();
                        documentRepo.saveAll(List.of(fichePaieS, contratS));

                        // 3c. Création d'Absences irrégulières pour Marie
                        absenceRepo.saveAll(List.of(
                                        Absence.builder()
                                                        .employe(marie)
                                                        .dateDebut(LocalDateTime.now().minusDays(2))
                                                        .dateFin(LocalDateTime.now().minusDays(2).plusHours(8))
                                                        .type("ABSENCE_IRREGULIERE")
                                                        .justifiee(false)
                                                        .statut("TEMPORAIRE")
                                                        .dateLimiteJustification(LocalDateTime.now().plusMinutes(1))
                                                        .build(),
                                        Absence.builder()
                                                        .employe(marie)
                                                        .dateDebut(LocalDateTime.now().minusHours(23).minusMinutes(59))
                                                        .dateFin(LocalDateTime.now().minusHours(23).minusMinutes(59)
                                                                        .plusHours(8))
                                                        .type("ABSENCE_IRREGULIERE")
                                                        .justifiee(false)
                                                        .statut("TEMPORAIRE")
                                                        .dateLimiteJustification(LocalDateTime.now().plusHours(24)
                                                                        .plusMinutes(1))
                                                        .build(),
                                        Absence.builder()
                                                        .employe(marie)
                                                        .dateDebut(LocalDateTime.now().minusDays(10))
                                                        .dateFin(LocalDateTime.now().minusDays(9))
                                                        .type("ABSENCE_IRREGULIERE")
                                                        .justifiee(true)
                                                        .statut("JUSTIFIEE")
                                                        .justificatifUrl("/uploads/certificat_marie.pdf")
                                                        .dateJustification(
                                                                        LocalDateTime.now().minusDays(10).plusHours(2)) // Justified
                                                                                                                        // 2h
                                                                                                                        // after
                                                                                                                        // start
                                                        .build()));

                        // 4. Création des Types de Congés
                        TypeConge annuel = TypeConge.builder()
                                        .nom("Congé annuel").categorie("Annuel").estPaye(true).maxDays(24)
                                        .justificatifObligatoire(false)
                                        .delaiDemandeJours(5).delaiJustificationHeures(0).build();
                        TypeConge exceptionnel = TypeConge.builder()
                                        .nom("Congé exceptionnel").categorie("Spécial").estPaye(true).maxDays(30)
                                        .justificatifObligatoire(true).delaiDemandeJours(1).delaiJustificationHeures(0)
                                        .build();
                        TypeConge maladie = TypeConge.builder()
                                        .nom("Congé maladie").categorie("Santé").estPaye(true).maxDays(5)
                                        .justificatifObligatoire(true)
                                        .delaiDemandeJours(0).delaiJustificationHeures(48).build();

                        typeCongeRepo.saveAll(List.of(annuel, maladie, exceptionnel));

                        // 5. Création des Sous-Types de Congés
                        SousTypeConge deces = SousTypeConge.builder().typeConge(exceptionnel).nom("DECES").maxJours(6)
                                        .build();
                        SousTypeConge mariage = SousTypeConge.builder().typeConge(exceptionnel).nom("MARIAGE")
                                        .maxJours(7).build();
                        SousTypeConge paternite = SousTypeConge.builder().typeConge(exceptionnel).nom("PATERNITE")
                                        .maxJours(7).build();
                        SousTypeConge visiteGouv = SousTypeConge.builder().typeConge(exceptionnel)
                                        .nom("Visite d’une institution gouvernementale").maxJours(1).build();
                        SousTypeConge accompagnement = SousTypeConge.builder().typeConge(exceptionnel)
                                        .nom("Congé d'accompagnement").maxJours(1).build();

                        SousTypeConge malOrdinaire = SousTypeConge.builder().typeConge(maladie).nom("MALADIE_ORDINAIRE")
                                        .maxJours(5).build();
                        SousTypeConge malLongueDurée = SousTypeConge.builder().typeConge(maladie).nom("LONGUE_DUREE")
                                        .maxJours(180).build();

                        SousTypeConge maternite = SousTypeConge.builder().typeConge(exceptionnel).nom("MATERNITE")
                                        .maxJours(112).build();

                        sousTypeCongeRepo.saveAll(List.of(deces, mariage, maternite, paternite, visiteGouv,
                                        accompagnement, malOrdinaire, malLongueDurée));
                        // 6. Création de Tickets de démonstration pour Marie
                        TicketSupport t1 = TicketSupport.builder()
                                        .employe(marie)
                                        .titre("Écran externe ne fonctionne plus")
                                        .description("Mon écran externe Dell ne s'allume plus depuis ce matin. Lumière orange clignotante.")
                                        .categorie("Matériel")
                                        .priorite(Priorite.HAUTE)
                                        .statut(StatutDemande.EN_ATTENTE)
                                        .dateCreation(LocalDateTime.of(2026, 4, 7, 10, 0))
                                        .build();
                        TicketSupport t2 = TicketSupport.builder()
                                        .employe(marie)
                                        .titre("Problème de connexion VPN")
                                        .description("Impossible de se connecter au VPN depuis le réseau domicile.")
                                        .categorie("IT")
                                        .priorite(Priorite.URGENTE)
                                        .statut(StatutDemande.FERME)
                                        .dateCreation(LocalDateTime.of(2026, 4, 3, 14, 0))
                                        .dateTraitement(LocalDateTime.of(2026, 4, 4, 9, 30))
                                        .build();
                        TicketSupport t3 = TicketSupport.builder()
                                        .employe(marie)
                                        .titre("Demande de licence Adobe")
                                        .description("Besoin d'une licence Adobe Creative Suite pour les maquettes du projet.")
                                        .categorie("IT")
                                        .priorite(Priorite.MOYENNE)
                                        .statut(StatutDemande.IN_PROGRESS)
                                        .dateCreation(LocalDateTime.of(2026, 3, 28, 9, 0))
                                        .build();
                        TicketSupport t4 = TicketSupport.builder()
                                        .employe(marie)
                                        .titre("Clavier défectueux")
                                        .description("Touches F5 et F6 ne répondent plus. Besoin de remplacement.")
                                        .categorie("Matériel")
                                        .priorite(Priorite.BASSE)
                                        .statut(StatutDemande.FERME)
                                        .dateCreation(LocalDateTime.of(2026, 3, 20, 11, 0))
                                        .dateTraitement(LocalDateTime.of(2026, 3, 21, 16, 0))
                                        .build();

                        ticketRepo.saveAll(List.of(t1, t2, t3, t4));

                        // 7. Tickets pour Jean (Total 5, 2 ouverts)
                        ticketRepo.saveAll(List.of(
                                        TicketSupport.builder().employe(jean).titre("Demande souris")
                                                        .description("Ma souris est cassée.")
                                                        .categorie("Matériel").priorite(Priorite.BASSE)
                                                        .statut(StatutDemande.EN_ATTENTE)
                                                        .dateCreation(LocalDateTime.now()).build(),
                                        TicketSupport.builder().employe(jean).titre("Problème Wi-Fi")
                                                        .description("Wifi instable au bureau 3.").categorie("IT")
                                                        .priorite(Priorite.MOYENNE)
                                                        .statut(StatutDemande.EN_ATTENTE)
                                                        .dateCreation(LocalDateTime.now().minusDays(1)).build(),
                                        TicketSupport.builder().employe(jean).titre("Logiciel 3D")
                                                        .description("Besoin de Blender 4.0.")
                                                        .categorie("Logiciel").priorite(Priorite.MOYENNE)
                                                        .statut(StatutDemande.RESOLU)
                                                        .dateCreation(LocalDateTime.now().minusDays(10)).build(),
                                        TicketSupport.builder().employe(jean).titre("Accès dossier")
                                                        .description("Pas accès au dossier projet X.").categorie("IT")
                                                        .priorite(Priorite.MOYENNE)
                                                        .statut(StatutDemande.FERME)
                                                        .dateCreation(LocalDateTime.now().minusDays(15)).build(),
                                        TicketSupport.builder().employe(jean).titre("Mail bloqué")
                                                        .description("Mails sortants bloqués.")
                                                        .categorie("IT").priorite(Priorite.HAUTE)
                                                        .statut(StatutDemande.FERME)
                                                        .dateCreation(LocalDateTime.now().minusDays(20)).build()));

                        // 8. Tickets pour Sophie (Total 7, 3 ouverts)
                        ticketRepo.saveAll(List.of(
                                        TicketSupport.builder().employe(sophie).titre("Tablette graphique")
                                                        .description("Stylet ne répond plus.").categorie("Matériel")
                                                        .priorite(Priorite.HAUTE)
                                                        .statut(StatutDemande.EN_ATTENTE)
                                                        .dateCreation(LocalDateTime.now()).build(),
                                        TicketSupport.builder().employe(sophie).titre("Besoin police écriture")
                                                        .description("Licence pour Helvetica.").categorie("Logiciel")
                                                        .priorite(Priorite.BASSE)
                                                        .statut(StatutDemande.EN_ATTENTE)
                                                        .dateCreation(LocalDateTime.now().minusHours(5)).build(),
                                        TicketSupport.builder().employe(sophie).titre("Chaise ergonomique")
                                                        .description("Mal au dos, besoin d'une chaise.")
                                                        .categorie("Mobilier")
                                                        .priorite(Priorite.MOYENNE).statut(StatutDemande.EN_ATTENTE)
                                                        .dateCreation(LocalDateTime.now().minusDays(2)).build(),
                                        TicketSupport.builder().employe(sophie).titre("Mot de passe")
                                                        .description("Reset mot de passe.")
                                                        .categorie("IT").priorite(Priorite.MOYENNE)
                                                        .statut(StatutDemande.FERME)
                                                        .dateCreation(LocalDateTime.now().minusDays(30)).build(),
                                        TicketSupport.builder().employe(sophie).titre("Clavier sale")
                                                        .description("Besoin de nettoyage.")
                                                        .categorie("Matériel").priorite(Priorite.BASSE)
                                                        .statut(StatutDemande.FERME)
                                                        .dateCreation(LocalDateTime.now().minusDays(35)).build(),
                                        TicketSupport.builder().employe(sophie).titre("Câble HDMI")
                                                        .description("Besoin d'un second câble.")
                                                        .categorie("Matériel").priorite(Priorite.BASSE)
                                                        .statut(StatutDemande.FERME)
                                                        .dateCreation(LocalDateTime.now().minusDays(40)).build(),
                                        TicketSupport.builder().employe(sophie).titre("Cafétéria")
                                                        .description("Badge ne passe pas à la cafet.")
                                                        .categorie("Service")
                                                        .priorite(Priorite.MOYENNE).statut(StatutDemande.FERME)
                                                        .dateCreation(LocalDateTime.now().minusDays(45)).build()));

                        ticketRepo.saveAll(List.of(t1, t2, t3, t4));

                        // 7. Travail Supplémentaire pour Marie
                        travailRepo.saveAll(List.of(
                                        DemandeTravail.builder().employe(marie).dateTravail(LocalDate.of(2026, 4, 18))
                                                        .dateCreation(LocalDateTime.of(2026, 4, 15, 10, 0)).nbHeures(4)
                                                        .motif("Migration des serveurs de base de données.")
                                                        .statut(StatutDemande.EN_ATTENTE)
                                                        .build(),
                                        DemandeTravail.builder().employe(marie).dateTravail(LocalDate.of(2026, 4, 11))
                                                        .dateCreation(LocalDateTime.of(2026, 4, 8, 14, 0)).nbHeures(6)
                                                        .motif("Préparation salon professionnel.")
                                                        .statut(StatutDemande.APPROUVEE).build(),
                                        DemandeTravail.builder().employe(marie).dateTravail(LocalDate.of(2026, 3, 28))
                                                        .dateCreation(LocalDateTime.of(2026, 3, 25, 9, 30)).nbHeures(3)
                                                        .motif("Finalisation rapport trimestriel.")
                                                        .statut(StatutDemande.REFUSEE).build(),
                                        DemandeTravail.builder().employe(marie).dateTravail(LocalDate.of(2026, 3, 15))
                                                        .dateCreation(LocalDateTime.of(2026, 3, 12, 11, 0)).nbHeures(2)
                                                        .motif("Maintenance infrastructure.")
                                                        .statut(StatutDemande.APPROUVEE).build()));

                        travailRepo.saveAll(List.of(
                                        DemandeTravail.builder().employe(jean).dateTravail(LocalDate.now().plusDays(5))
                                                        .dateCreation(LocalDateTime.now()).nbHeures(3)
                                                        .motif("Optimisation scripts SQL")
                                                        .statut(StatutDemande.EN_ATTENTE).build(),
                                        DemandeTravail.builder().employe(jean)
                                                        .dateTravail(LocalDate.now().minusDays(10))
                                                        .dateCreation(LocalDateTime.now().minusDays(12)).nbHeures(4)
                                                        .motif("Audit Sécurité")
                                                        .statut(StatutDemande.APPROUVEE).build(),
                                        DemandeTravail.builder().employe(jean).dateTravail(LocalDate.now().minusDays(2))
                                                        .dateCreation(LocalDateTime.now().minusDays(5)).nbHeures(4)
                                                        .motif("Fix bug critique")
                                                        .statut(StatutDemande.APPROUVEE).build(),
                                        DemandeTravail.builder().employe(jean)
                                                        .dateTravail(LocalDate.now().minusDays(10))
                                                        .dateCreation(LocalDateTime.now().minusDays(15)).nbHeures(2)
                                                        .motif("Support équipe dev")
                                                        .statut(StatutDemande.APPROUVEE).build(),
                                        DemandeTravail.builder().employe(jean)
                                                        .dateTravail(LocalDate.now().minusDays(20))
                                                        .dateCreation(LocalDateTime.now().minusDays(25)).nbHeures(5)
                                                        .motif("Déploiement production")
                                                        .statut(StatutDemande.APPROUVEE).build()));

                        // 10. Travail Supplémentaire pour Sophie (6 entries)
                        travailRepo.saveAll(List.of(
                                        DemandeTravail.builder().employe(sophie)
                                                        .dateTravail(LocalDate.now().plusDays(2))
                                                        .dateCreation(LocalDateTime.now()).nbHeures(2)
                                                        .motif("Design nouveau module UI")
                                                        .statut(StatutDemande.EN_ATTENTE).build(),
                                        DemandeTravail.builder().employe(sophie)
                                                        .dateTravail(LocalDate.now().plusDays(3))
                                                        .dateCreation(LocalDateTime.now().minusHours(2)).nbHeures(4)
                                                        .motif("Révision maquettes client")
                                                        .statut(StatutDemande.EN_ATTENTE).build(),
                                        DemandeTravail.builder().employe(sophie)
                                                        .dateTravail(LocalDate.now().minusDays(1))
                                                        .dateCreation(LocalDateTime.now().minusDays(4)).nbHeures(3)
                                                        .motif("Retouches iconographie")
                                                        .statut(StatutDemande.APPROUVEE).build(),
                                        DemandeTravail.builder().employe(sophie)
                                                        .dateTravail(LocalDate.now().minusDays(5))
                                                        .dateCreation(LocalDateTime.now().minusDays(8)).nbHeures(6)
                                                        .motif("Workshop design system")
                                                        .statut(StatutDemande.APPROUVEE).build(),
                                        DemandeTravail.builder().employe(sophie)
                                                        .dateTravail(LocalDate.now().minusDays(12))
                                                        .dateCreation(LocalDateTime.now().minusDays(16)).nbHeures(2)
                                                        .motif("Ajustement contrastes accessibilité")
                                                        .statut(StatutDemande.REFUSEE).build(),
                                        DemandeTravail.builder().employe(sophie)
                                                        .dateTravail(LocalDate.now().minusDays(20))
                                                        .dateCreation(LocalDateTime.now().minusDays(25)).nbHeures(5)
                                                        .motif("Présentation concept créatif")
                                                        .statut(StatutDemande.APPROUVEE).build()));

                        // 10. Congés pour Marie (Spécifiques demandés)
                        congeRepo.saveAll(List.of(
                                        DemandeConge.builder().employe(marie).typeConge(annuel)
                                                        .dateDebut(LocalDate.of(2026, 4, 10))
                                                        .dateFin(LocalDate.of(2026, 4, 14)).dureeJours(5)
                                                        .statut(StatutDemande.EN_ATTENTE)
                                                        .dateCreation(LocalDateTime.of(2026, 4, 5, 9, 0)).build(),
                                        DemandeConge.builder().employe(marie).typeConge(maladie)
                                                        .sousTypeConge(malOrdinaire).dateDebut(LocalDate.of(2026, 3, 1))
                                                        .dateFin(LocalDate.of(2026, 3, 3)).dureeJours(3)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.of(2026, 2, 28, 10, 0)).build(),
                                        DemandeConge.builder().employe(marie).typeConge(exceptionnel)
                                                        .sousTypeConge(mariage).dateDebut(LocalDate.of(2026, 2, 14))
                                                        .dateFin(LocalDate.of(2026, 2, 15)).dureeJours(2)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.of(2026, 2, 10, 8, 30)).build(),
                                        DemandeConge.builder().employe(marie).typeConge(annuel)
                                                        .dateDebut(LocalDate.of(2026, 1, 20))
                                                        .dateFin(LocalDate.of(2026, 1, 24)).dureeJours(5)
                                                        .statut(StatutDemande.REFUSEE).motifRefus("Pic de production")
                                                        .dateCreation(LocalDateTime.of(2026, 1, 15, 14, 0)).build()));

                        // 11. Congés pour Jean (5 lignes différentes)
                        congeRepo.saveAll(List.of(
                                        DemandeConge.builder().employe(jean).typeConge(annuel)
                                                        .dateDebut(LocalDate.of(2026, 7, 1))
                                                        .dateFin(LocalDate.of(2026, 7, 5)).dureeJours(5)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.now().minusMonths(3)).build(),
                                        DemandeConge.builder().employe(jean).typeConge(exceptionnel)
                                                        .sousTypeConge(paternite).dateDebut(LocalDate.of(2026, 5, 1))
                                                        .dateFin(LocalDate.of(2026, 5, 8)).dureeJours(7)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.now().minusDays(20)).build(),
                                        DemandeConge.builder().employe(jean).typeConge(annuel)
                                                        .dateDebut(LocalDate.of(2026, 8, 20))
                                                        .dateFin(LocalDate.of(2026, 8, 22)).dureeJours(2)
                                                        .statut(StatutDemande.EN_ATTENTE)
                                                        .dateCreation(LocalDateTime.now()).build(),
                                        DemandeConge.builder().employe(jean).typeConge(maladie)
                                                        .sousTypeConge(malOrdinaire)
                                                        .dateDebut(LocalDate.of(2026, 2, 10))
                                                        .dateFin(LocalDate.of(2026, 2, 12)).dureeJours(2)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.now().minusMonths(4)).build(),
                                        DemandeConge.builder().employe(jean).typeConge(annuel)
                                                        .dateDebut(LocalDate.of(2025, 12, 24))
                                                        .dateFin(LocalDate.of(2025, 12, 31)).dureeJours(8)
                                                        .statut(StatutDemande.REFUSEE)
                                                        .motifRefus("Période de clôture comptable bloquée")
                                                        .dateCreation(LocalDateTime.now().minusMonths(6)).build()));

                        // 12. Congés pour Sophie (6 lignes différentes)
                        congeRepo.saveAll(List.of(
                                        DemandeConge.builder().employe(sophie).typeConge(annuel)
                                                        .dateDebut(LocalDate.of(2026, 9, 10))
                                                        .dateFin(LocalDate.of(2026, 9, 15)).dureeJours(5)
                                                        .statut(StatutDemande.EN_ATTENTE)
                                                        .dateCreation(LocalDateTime.now()).build(),
                                        DemandeConge.builder().employe(sophie).typeConge(maladie)
                                                        .sousTypeConge(malLongueDurée)
                                                        .dateDebut(LocalDate.of(2026, 1, 1))
                                                        .dateFin(LocalDate.of(2026, 1, 31)).dureeJours(31)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.now().minusMonths(5)).build(),
                                        DemandeConge.builder().employe(sophie).typeConge(exceptionnel)
                                                        .sousTypeConge(deces).dateDebut(LocalDate.of(2026, 3, 15))
                                                        .dateFin(LocalDate.of(2026, 3, 18)).dureeJours(4)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.now().minusMonths(2)).build(),
                                        DemandeConge.builder().employe(sophie).typeConge(annuel)
                                                        .dateDebut(LocalDate.of(2026, 4, 1))
                                                        .dateFin(LocalDate.of(2026, 4, 2)).dureeJours(2)
                                                        .statut(StatutDemande.REFUSEE)
                                                        .motifRefus("Urgence projet client")
                                                        .dateCreation(LocalDateTime.now().minusDays(5)).build(),
                                        DemandeConge.builder().employe(sophie).typeConge(exceptionnel)
                                                        .sousTypeConge(visiteGouv).dateDebut(LocalDate.of(2026, 5, 10))
                                                        .dateFin(LocalDate.of(2026, 5, 10)).dureeJours(1)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.now().minusDays(2)).build(),
                                        DemandeConge.builder().employe(sophie).typeConge(annuel)
                                                        .dateDebut(LocalDate.of(2025, 11, 1))
                                                        .dateFin(LocalDate.of(2025, 11, 5)).dureeJours(5)
                                                        .statut(StatutDemande.APPROUVEE)
                                                        .dateCreation(LocalDateTime.now().minusMonths(8)).build()));

                        // 13. Absences et Autorisations
                        absenceRepo.saveAll(List.of(
                                        Absence.builder()
                                                        .employe(jean)
                                                        .dateDebut(LocalDateTime.now().minusMinutes(2)) // Started 2
                                                                                                        // mins ago
                                                        .dateFin(LocalDateTime.now().plusHours(8))
                                                        .type("ABSENCE_IRREGULIERE")
                                                        .justifiee(false)
                                                        .statut("TEMPORAIRE")
                                                        .dateLimiteJustification(LocalDateTime.now().plusDays(1))
                                                        .build(),
                                        Absence.builder()
                                                        .employe(jean)
                                                        .dateDebut(LocalDateTime.now().minusDays(1))
                                                        .dateFin(LocalDateTime.now().minusDays(1).plusHours(4))
                                                        .type("ABSENCE_IRREGULIERE")
                                                        .justifiee(false)
                                                        .statut("TEMPORAIRE")
                                                        .dateLimiteJustification(LocalDateTime.now().plusDays(1))
                                                        .build(),
                                        Absence.builder()
                                                        .employe(sophie)
                                                        .dateDebut(LocalDateTime.now().minusDays(5))
                                                        .dateFin(LocalDateTime.now().minusDays(5).plusHours(8))
                                                        .type("ABSENCE_IRREGULIERE")
                                                        .justifiee(false)
                                                        .statut("EN_ATTENTE")
                                                        .justificatifUrl("/uploads/justif_sophie.pdf")
                                                        .dateJustification(
                                                                        LocalDateTime.now().minusDays(5).plusHours(4)) // Justified
                                                                                                                       // 4h
                                                                                                                       // after
                                                                                                                       // start
                                                        .dateLimiteJustification(LocalDateTime.now().minusDays(3))
                                                        .build()));

                        AutorisationSortie autoS1 = AutorisationSortie.builder().employe(sophie).heures(3)
                                        .dateAutorisation(LocalDate.now().minusDays(2)).build();
                        AutorisationSortie autoS2 = AutorisationSortie.builder().employe(sophie).heures(4)
                                        .dateAutorisation(LocalDate.now().minusDays(5)).build();
                        autoRepo.saveAll(List.of(autoS1, autoS2));
                        soldeSophie.ajouterHeuresSortie(7);
                        soldeRepo.save(soldeSophie);

                        // 11. Notifications personnalisées pour chaque utilisateur
                        notificationRepo.saveAll(List.of(
                                        // Notifications pour Marie
                                        Notification.builder().user(marie).message(
                                                        "Votre demande de congé (Congé annuel) du 1er Mars a été approuvée.")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(10)).build(),
                                        Notification.builder().user(marie).message(
                                                        "Votre demande de congé du 20 Janvier a été REFUSÉE (Pic de production).")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(30)).build(),
                                        Notification.builder().user(marie).message(
                                                        "Votre demande de travail supplémentaire du 11 Avril a été approuvée.")
                                                        .type(TypeNotification.INTERNE).isRead(false)
                                                        .createdAt(LocalDateTime.now().minusDays(2)).build(),
                                        Notification.builder().user(marie).message(
                                                        "Votre ticket 'Problème de connexion VPN' est maintenant FERMÉ.")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(5)).build(),
                                        Notification.builder().user(marie).message(
                                                        "Une absence irrégulière a été enregistrée récemment. Merci de la justifier sous 48h.")
                                                        .type(TypeNotification.INTERNE).isRead(false)
                                                        .createdAt(LocalDateTime.now().minusHours(24)).build(),

                                        // Notifications pour Jean
                                        Notification.builder().user(jean).message(
                                                        "Votre demande de congé (Congé annuel) du 1er Juillet a été approuvée.")
                                                        .type(TypeNotification.INTERNE).isRead(false)
                                                        .createdAt(LocalDateTime.now().minusHours(1)).build(),
                                        Notification.builder().user(jean).message(
                                                        "Votre demande de congé (Paternité) du 1er Mai a été approuvée.")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(5)).build(),
                                        Notification.builder().user(jean).message(
                                                        "Votre ticket 'Logiciel 3D' a été RÉSOLU par le support.")
                                                        .type(TypeNotification.INTERNE).isRead(false)
                                                        .createdAt(LocalDateTime.now().minusHours(5)).build(),
                                        Notification.builder().user(jean).message(
                                                        "Votre demande de travail supplémentaire (Audit Sécurité) a été approuvée.")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(1)).build(),
                                        Notification.builder().user(jean).message(
                                                        "Le statut de votre ticket 'Accès dossier' est passé à FERMÉ.")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(3)).build(),

                                        // Notifications pour Sophie
                                        Notification.builder().user(sophie).message(
                                                        "Votre demande de congé du 1er Avril a été REFUSÉE (Urgence projet client).")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(10)).build(),
                                        Notification.builder().user(sophie).message(
                                                        "Votre demande de congé (Décès) du 15 Mars a été approuvée.")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(20)).build(),
                                        Notification.builder().user(sophie).message(
                                                        "Une autorisation de sortie de 3h a été enregistrée pour le "
                                                                        + autoS1.getDateAutorisation())
                                                        .type(TypeNotification.INTERNE).isRead(false)
                                                        .createdAt(LocalDateTime.now().minusHours(2)).build(),
                                        Notification.builder().user(sophie).message(
                                                        "Votre demande de travail supplémentaire (Workshop design system) a été approuvée.")
                                                        .type(TypeNotification.INTERNE).isRead(true)
                                                        .createdAt(LocalDateTime.now().minusDays(1)).build(),
                                        Notification.builder().user(sophie).message(
                                                        "Votre demande de travail supplémentaire (Ajustement contrastes) a été REFUSÉE.")
                                                        .type(TypeNotification.INTERNE).isRead(false)
                                                        .createdAt(LocalDateTime.now().minusHours(10)).build()));

                        System.out.println(
                                        "✅ Base de données initialisée avec succès ! (Utilisateurs, Congés, Tickets, Absences, Heures Sup et Notifications personnalisées)");
                }

                // Annonces (Toujours vérifier car elles ont pu être ajoutées plus tard dans le
                // code)
                if (announcementRepo.count() == 0) {
                        User author = userRepo.findAll().stream()
                                        .filter(u -> u.getRole() == Role.ADMIN)
                                        .findFirst()
                                        .orElse(null);

                        if (author != null) {
                                Announcement ann1 = Announcement.builder()
                                                .author(author)
                                                .title("Événement Partenariat Externe")
                                                .content("Nous sommes fiers d'annoncer un nouveau partenariat stratégique avec la plateforme Cloud Innovation pour booster nos projets IA.")
                                                .category(AnnouncementCategory.EXTERNE)
                                                .status(AnnouncementStatus.PUBLISHED)
                                                .createdAt(LocalDateTime.of(2026, 4, 5, 10, 0))
                                                .platforms(List.of(Plateforme.LINKEDIN, Plateforme.FACEBOOK))
                                                .build();

                                Announcement ann2 = Announcement.builder()
                                                .author(author)
                                                .title("Formation Sécurité Incendie")
                                                .content("Une session de formation obligatoire sur la sécurité incendie aura lieu le 15 avril à 10h00 dans la salle de conférence.")
                                                .category(AnnouncementCategory.INTERNE)
                                                .status(AnnouncementStatus.PUBLISHED)
                                                .createdAt(LocalDateTime.of(2026, 4, 10, 0, 0))
                                                .build();

                                announcementRepo.saveAll(List.of(ann1, ann2));
                                System.out.println("✅ Annonces par défaut créées !");
                        }
                }
        }
}
