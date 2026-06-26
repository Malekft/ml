package com.hrplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "activity_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 500) private String action;
    @Builder.Default
    @Column(nullable = false, length = 20) private String type = "info";
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
