package com.hrplatform.repository;

import com.hrplatform.entity.Employe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {
    Optional<Employe> findByMatricule(String matricule);
    
    @Query("SELECT COUNT(e) FROM Employe e")
    long countAll();
}
