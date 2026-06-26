package com.hrplatform.dto;

import lombok.*;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class UserChatDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String role;
    private String poste;
    private String avatar;
}
