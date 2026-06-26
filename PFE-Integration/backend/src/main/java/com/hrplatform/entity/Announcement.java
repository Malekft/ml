package com.hrplatform.entity;

import com.hrplatform.enums.AnnouncementCategory;
import com.hrplatform.enums.AnnouncementStatus;
import com.hrplatform.enums.Plateforme;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity @Table(name = "announcements")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Announcement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 300) private String title;
    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)") private String content;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnnouncementCategory category = AnnouncementCategory.INTERNE;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnnouncementStatus status = AnnouncementStatus.PUBLISHED;

    @Column(name = "scheduled_date") private LocalDateTime scheduledDate;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;

    @ElementCollection(targetClass = Plateforme.class)
    @CollectionTable(name = "announcement_platforms",
            joinColumns = @JoinColumn(name = "announcement_id"))
    @Column(name = "platform", length = 20)
    @Enumerated(EnumType.STRING)
    private List<Plateforme> platforms;
    
    @ManyToMany
    @JoinTable(
        name = "announcement_likes",
        joinColumns = @JoinColumn(name = "announcement_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> likedBy = new HashSet<>();

    @OneToMany(mappedBy = "announcement", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AnnouncementComment> comments = new ArrayList<>();

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
