package com.hrplatform.repository;
import com.hrplatform.entity.SousTypeConge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SousTypeCongeRepository extends JpaRepository<SousTypeConge, Long> {
    List<SousTypeConge> findByTypeCongeId(Long typeCongeId);
}
