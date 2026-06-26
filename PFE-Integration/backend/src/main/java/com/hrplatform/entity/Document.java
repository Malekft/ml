package com.hrplatform.entity;

import com.hrplatform.enums.TypeDocument;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    private Employe employe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id")
    private Demande demande;

    @Column(name = "file_name", nullable = false, length = 255) private String fileName;
    @Column(name = "file_url",  nullable = false, length = 1000) private String fileUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypeDocument type = TypeDocument.AUTRE;

    @Column(name = "uploaded_at", nullable = false) private LocalDateTime uploadedAt;
    @Builder.Default
    @Column(nullable = false) private Boolean validated = false;

    @PrePersist void onCreate() { uploadedAt = LocalDateTime.now(); }
}
