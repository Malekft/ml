package com.hrplatform.repository;
import com.hrplatform.entity.SoldeConge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SoldeCongeRepository extends JpaRepository<SoldeConge, Long> {
    Optional<SoldeConge> findByEmployeId(Long employeId);
    Optional<SoldeConge> findByEmployeIdAndAnnee(Long employeId, Integer annee);
}
