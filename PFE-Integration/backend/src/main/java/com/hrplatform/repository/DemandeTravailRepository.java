package com.hrplatform.repository;

import com.hrplatform.entity.DemandeTravail;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DemandeTravailRepository extends JpaRepository<DemandeTravail, Long> {
    List<DemandeTravail> findByEmployeId(Long employeId);
}
