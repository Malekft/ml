package com.hrplatform.service;

import com.hrplatform.dto.DashboardStatsDTO;
import com.hrplatform.enums.StatutDemande;
import com.hrplatform.enums.Priorite;
import com.hrplatform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service @RequiredArgsConstructor
public class DashboardService {
    private final EmployeRepository employeRepo;
    private final DemandeRepository demandeRepo;
    private final DemandeCongeRepository demandeCongeRepo;
    private final TicketSupportRepository ticketRepo;
    private final AbsenceRepository absenceRepo;
    private final AutorisationSortieRepository autoRepo;
    private final DemandeTravailRepository travailRepo;
    private final com.hrplatform.controller.ChatWebSocketHandler chatWebSocketHandler;

    public DashboardStatsDTO getStats() {
        long totalEmployes      = employeRepo.count();
        java.time.LocalDateTime gracePeriodLimit = java.time.LocalDateTime.now().minusSeconds(60);
        long demandesEnAttente  = demandeCongeRepo.countByStatutAndDateCreationBefore(StatutDemande.EN_ATTENTE, gracePeriodLimit);
        long ticketsOuverts     = ticketRepo.countByStatutAndDateCreationBefore(StatutDemande.EN_ATTENTE, gracePeriodLimit)
                                + ticketRepo.countByStatut(StatutDemande.IN_PROGRESS);
        long ticketsUrgents     = ticketRepo.countByPrioriteAndDateCreationBefore(Priorite.URGENTE, gracePeriodLimit);
        long ticketsBasse       = ticketRepo.countByPrioriteAndDateCreationBefore(Priorite.BASSE, gracePeriodLimit);
        long ticketsResolved    = ticketRepo.countByStatut(StatutDemande.RESOLU)
                                + ticketRepo.countByStatut(StatutDemande.FERME);
        long totalTickets       = ticketRepo.count();

        return DashboardStatsDTO.builder()
                .totalEmployes(totalEmployes)
                .employesActifs(chatWebSocketHandler.getOnlineUsersCount())
                .demandesEnAttente(demandesEnAttente)
                .ticketsOuverts(ticketsOuverts)
                .ticketsUrgents(ticketsUrgents)
                .ticketsPrioriteBasse(ticketsBasse)
                .absencesNonJustifiees(absenceRepo.countByJustifieeFalseAndStatutNot("EN_ATTENTE"))
                .demandesParStatut(Map.of(
                    "EN_ATTENTE", demandeRepo.countByStatut(StatutDemande.EN_ATTENTE),
                    "APPROUVEE",  demandeRepo.countByStatut(StatutDemande.APPROUVEE),
                    "REFUSEE",    demandeRepo.countByStatut(StatutDemande.REFUSEE)
                ))
                .ticketsParStatut(Map.of(
                    "EN_ATTENTE",  ticketRepo.countByStatutAndDateCreationBefore(StatutDemande.EN_ATTENTE, gracePeriodLimit),
                    "IN_PROGRESS", ticketRepo.countByStatut(StatutDemande.IN_PROGRESS),
                    "RESOLU",      ticketRepo.countByStatut(StatutDemande.RESOLU),
                    "FERME",       ticketRepo.countByStatut(StatutDemande.FERME)
                ))
                .absencesParMois(getMonthlyAbsences())
                .autorisationsParMois(getMonthlyAutorisations())
                .ticketsParMois(getMonthlyTickets(gracePeriodLimit))
                .travailParMois(getMonthlyTravail(gracePeriodLimit))
                .build();
    }

    private Map<String, Long> getMonthlyTravail(java.time.LocalDateTime gracePeriodLimit) {
        java.time.LocalDateTime sixMonthsAgo = java.time.LocalDateTime.now().minusMonths(6);
        return travailRepo.findAll().stream()
                .filter(t -> t.getDateCreation().isAfter(sixMonthsAgo))
                .filter(t -> t.getStatut() != StatutDemande.EN_ATTENTE || t.getDateCreation().isBefore(gracePeriodLimit))
                .collect(java.util.stream.Collectors.groupingBy(
                        t -> t.getDateCreation().getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.FRENCH),
                        java.util.stream.Collectors.counting()
                ));
    }

    private Map<String, Long> getMonthlyTickets(java.time.LocalDateTime gracePeriodLimit) {
        java.time.LocalDateTime sixMonthsAgo = java.time.LocalDateTime.now().minusMonths(6);
        return ticketRepo.findAll().stream()
                .filter(t -> t.getDateCreation().isAfter(sixMonthsAgo))
                .filter(t -> t.getStatut() != StatutDemande.EN_ATTENTE || t.getDateCreation().isBefore(gracePeriodLimit))
                .collect(java.util.stream.Collectors.groupingBy(
                        t -> t.getDateCreation().getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.FRENCH),
                        java.util.stream.Collectors.counting()
                ));
    }

    private Map<String, Long> getMonthlyAbsences() {
        java.time.LocalDateTime sixMonthsAgo = java.time.LocalDateTime.now().minusMonths(6);
        return absenceRepo.findAll().stream()
                .filter(a -> a.getDateDebut().isAfter(sixMonthsAgo))
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> a.getDateDebut().getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.FRENCH),
                        java.util.stream.Collectors.counting()
                ));
    }

    private Map<String, Long> getMonthlyAutorisations() {
        java.time.LocalDate sixMonthsAgo = java.time.LocalDate.now().minusMonths(6);
        return autoRepo.findAll().stream()
                .filter(a -> a.getDateAutorisation().isAfter(sixMonthsAgo))
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> a.getDateAutorisation().getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.FRENCH),
                        java.util.stream.Collectors.counting()
                ));
    }
}
