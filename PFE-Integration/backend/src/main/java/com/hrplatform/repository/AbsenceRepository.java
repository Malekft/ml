package com.hrplatform.repository;
import com.hrplatform.entity.Absence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AbsenceRepository extends JpaRepository<Absence, Long> {
    List<Absence> findByEmployeId(Long employeId);
    long countByJustifieeFalse();
    long countByStatutAndJustifieeFalse(String statut);
    long countByJustifieeFalseAndStatutNot(String statut);
}
