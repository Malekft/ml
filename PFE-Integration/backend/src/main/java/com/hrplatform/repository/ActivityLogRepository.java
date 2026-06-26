package com.hrplatform.repository;
import com.hrplatform.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.util.List;
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
