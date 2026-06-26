package com.hrplatform.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;

import com.hrplatform.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public abstract class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100) private String nom;
    @Column(nullable = false, length = 100) private String prenom;
    @Column(nullable = false, unique = true, length = 200) private String email;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Column(length = 20) private String telephone;
    private String avatar;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.EMPLOYE;

    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Notification> notifications;

    @PrePersist  void onCreate() {
        if (createdAt == null) createdAt = updatedAt = LocalDateTime.now();
        if (avatar == null || avatar.isEmpty()) {
            avatar = generateAvatar(email);
        }
    }
    @PreUpdate   void onUpdate() { updatedAt = LocalDateTime.now(); }

    public static String generateAvatar(String identifier) {
        if (identifier == null || identifier.isEmpty()) return "avatar-bg-1";
        int hash = 0;
        for (int i = 0; i < identifier.length(); i++) {
            hash = identifier.charAt(i) + ((hash << 5) - hash);
        }
        int index = Math.abs(hash % 10) + 1;
        return "avatar-bg-" + index;
    }
}
