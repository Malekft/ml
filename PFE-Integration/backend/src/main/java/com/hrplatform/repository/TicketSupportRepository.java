package com.hrplatform.repository;
import com.hrplatform.entity.TicketSupport;
import com.hrplatform.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TicketSupportRepository extends JpaRepository<TicketSupport, Long> {
    List<TicketSupport> findByEmployeId(Long employeId);
    List<TicketSupport> findByStatut(StatutDemande statut);
    List<TicketSupport> findByPriorite(Priorite priorite);
    long countByStatut(StatutDemande statut);
    long countByPriorite(Priorite priorite);
    
    long countByStatutAndDateCreationBefore(StatutDemande statut, java.time.LocalDateTime limit);
    long countByPrioriteAndDateCreationBefore(Priorite priorite, java.time.LocalDateTime limit);
}
