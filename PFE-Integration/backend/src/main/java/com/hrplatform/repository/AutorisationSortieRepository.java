package com.hrplatform.repository;

import com.hrplatform.entity.AutorisationSortie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AutorisationSortieRepository extends JpaRepository<AutorisationSortie, Long> {
    List<AutorisationSortie> findByEmployeId(Long employeId);
}
