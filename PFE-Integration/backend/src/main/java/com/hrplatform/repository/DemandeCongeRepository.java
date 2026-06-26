package com.hrplatform.repository;

import com.hrplatform.entity.DemandeConge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeCongeRepository extends JpaRepository<DemandeConge, Long> {
    List<DemandeConge> findByEmployeId(Long employeId);
    
    long countByStatutAndDateCreationBefore(com.hrplatform.enums.StatutDemande statut, java.time.LocalDateTime limit);

}
