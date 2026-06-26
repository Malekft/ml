package com.hrplatform.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity @Table(name = "administrateurs")
@PrimaryKeyJoinColumn(name = "user_id")
@Data @NoArgsConstructor @AllArgsConstructor @SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class Administrateur extends User {
    @Column(nullable = false, length = 150)
    private String fonction;
}
