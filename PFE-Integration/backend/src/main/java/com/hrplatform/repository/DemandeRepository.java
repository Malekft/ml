package com.hrplatform.repository;

import com.hrplatform.entity.Demande;
import com.hrplatform.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {
    List<Demande> findByEmployeId(Long employeId);

    List<Demande> findByStatut(StatutDemande statut);

    List<Demande> findByEmployeIdAndStatut(Long employeId, StatutDemande statut);

    long countByStatut(StatutDemande statut);

    long countByStatutAndDateCreationBefore(StatutDemande statut, java.time.LocalDateTime limit);

    @Query("SELECT MONTH(d.dateCreation) as month, COUNT(d) as count FROM Demande d GROUP BY MONTH(d.dateCreation) ORDER BY month")
    List<Object[]> countByMonth();
}
