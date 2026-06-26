package com.hrplatform.service;

import com.hrplatform.dto.*;
import com.hrplatform.entity.*;
import com.hrplatform.enums.Role;
import com.hrplatform.repository.*;
import com.hrplatform.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authManager;
    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest req) {
        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        } catch (AuthenticationException e) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        Long employeId = null;
        if (user.getRole() == Role.EMPLOYE) {
            employeId = user.getId();
        }

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole().name())
                .userId(user.getId())
                .employeId(employeId)
                .avatar(user.getAvatar() != null ? user.getAvatar() : User.generateAvatar(user.getEmail()))
                .build();
    }
}
