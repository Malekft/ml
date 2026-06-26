package com.hrplatform.repository;
import com.hrplatform.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByDemandeId(Long demandeId);
    List<Document> findByEmployeId(Long employeId);
}
