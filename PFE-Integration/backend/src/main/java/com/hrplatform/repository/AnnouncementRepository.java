package com.hrplatform.repository;
import com.hrplatform.entity.Announcement;
import com.hrplatform.enums.AnnouncementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByStatusOrderByCreatedAtDesc(AnnouncementStatus status);
    List<Announcement> findAllByOrderByCreatedAtDesc();
    long countByStatus(AnnouncementStatus status);
}
