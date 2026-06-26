package com.hrplatform.dto;

import lombok.*;
import java.util.Map;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class DashboardStatsDTO {
    private long totalEmployes;
    private long employesActifs;
    private long demandesEnAttente;
    private long ticketsOuverts;
    private long ticketsUrgents;
    private long ticketsPrioriteBasse;
    private long absencesNonJustifiees;
    private Map<String, Long> demandesParStatut;
    private Map<String, Long> ticketsParStatut;
    private Map<String, Long> absencesParMois;
    private Map<String, Long> autorisationsParMois;
    private Map<String, Long> ticketsParMois;
    private Map<String, Long> travailParMois;
}
