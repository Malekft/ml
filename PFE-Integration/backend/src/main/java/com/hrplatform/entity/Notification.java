package com.hrplatform.entity;

import com.hrplatform.enums.TypeNotification;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "notifications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id")
    private Demande demande;

    @Column(nullable = false, length = 500) private String message;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeNotification type = TypeNotification.INTERNE;

    @Builder.Default
    @Column(name = "is_read", nullable = false) private Boolean isRead = false;
    @Builder.Default
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
    public void marquerCommeLu() { this.isRead = true; }
}
