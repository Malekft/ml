package com.hrplatform.entity;

import com.hrplatform.enums.Priorite;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;

@Entity @Table(name = "ticket_support")
@PrimaryKeyJoinColumn(name = "demande_id")
@DiscriminatorValue("TICKET")
@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class TicketSupport extends Demande {

    @Column(nullable = false, length = 300) private String titre;
    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)") private String description;
    @Column(nullable = false, length = 100) private String categorie;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Priorite priorite = Priorite.MOYENNE;

    @Column(name = "sla_deadline")    private LocalDateTime slaDeadline;

    @PrePersist void onCreateTicket() {
        if (Priorite.URGENTE.equals(priorite)) {
            slaDeadline = LocalDateTime.now().plusHours(8);
        } else if (Priorite.HAUTE.equals(priorite)) {
            slaDeadline = LocalDateTime.now().plusHours(24);
        } else if (Priorite.MOYENNE.equals(priorite)) {
            slaDeadline = LocalDateTime.now().plusHours(72);
        } else {
            slaDeadline = LocalDateTime.now().plusHours(168);
        }
    }

    public void escaladerProbleme() { this.priorite = Priorite.URGENTE; }
}
