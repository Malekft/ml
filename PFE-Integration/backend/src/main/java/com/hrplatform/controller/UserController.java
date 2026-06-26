package com.hrplatform.controller;

import com.hrplatform.dto.UserChatDTO;
import com.hrplatform.entity.Employe;
import com.hrplatform.entity.User;
import com.hrplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/chat")
    public ResponseEntity<List<UserChatDTO>> getAllForChat() {
        List<UserChatDTO> users = userRepo.findAll().stream()
                .map(u -> {
                    String poste = "";
                    if (u instanceof Employe) {
                        poste = ((Employe) u).getPoste();
                    }
                    return UserChatDTO.builder()
                            .id(u.getId())
                            .nom(u.getNom())
                            .prenom(u.getPrenom())
                            .email(u.getEmail())
                            .role(u.getRole().name())
                            .poste(poste)
                            .avatar(u.getAvatar() != null ? u.getAvatar() : User.generateAvatar(u.getEmail()))
                            .build();
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
        }

        String email = auth.getName();
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le nouveau mot de passe doit contenir au moins 6 caractères"));
        }

        User user = userRepo.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Utilisateur introuvable"));
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mot de passe actuel incorrect"));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));
    }
}
