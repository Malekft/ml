package com.hrplatform.repository;

import com.hrplatform.entity.AnnouncementComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementCommentRepository extends JpaRepository<AnnouncementComment, Long> {
}
