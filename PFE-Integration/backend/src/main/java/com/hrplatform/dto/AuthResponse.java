package com.hrplatform.dto;

import lombok.*;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private Long userId;
    private Long employeId;
    private String avatar;
}
