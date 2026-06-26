package com.hrplatform.controller;

import com.hrplatform.entity.*;
import com.hrplatform.enums.Role;
import com.hrplatform.enums.TypeDocument;
import com.hrplatform.repository.*;
import com.hrplatform.service.EmployeService;
import com.hrplatform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController @RequestMapping("/admin") @RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepo;
    private final EmployeRepository employeRepo;
    private final AdministrateurRepository adminRepo;
    private final SoldeCongeRepository soldeRepo;
    private final EmployeService employeService;
    private final ActivityLogRepository logRepo;
    private final AnnouncementRepository announcementRepo;
    private final PasswordEncoder passwordEncoder;
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final DocumentRepository documentRepo;
    private final NotificationService notificationService;

    @GetMapping("/users")
    public ResponseEntity<List<Map<String,Object>>> getUsers() {
        List<Map<String,Object>> users = userRepo.findAll().stream().map(u -> {
            java.util.HashMap<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("nom", u.getPrenom() + " " + u.getNom());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            map.put("statut", "Actif");
            map.put("avatar", u.getAvatar() != null ? u.getAvatar() : User.generateAvatar(u.getEmail()));
            map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/managers")
    public ResponseEntity<List<Map<String,Object>>> getManagers() {
        List<Map<String,Object>> managers = adminRepo.findAll().stream().map(a -> {
            java.util.HashMap<String, Object> map = new java.util.HashMap<>();
            map.put("id", a.getId());
            map.put("nom", a.getPrenom() + " " + a.getNom());
            map.put("avatar", a.getAvatar() != null ? a.getAvatar() : User.generateAvatar(a.getEmail()));
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(managers);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        String roleStr = (String) body.get("role");
        String email = (String) body.get("email");
        String nom = (String) body.get("nom");
        String prenom = (String) body.get("prenom");
        String telephone = (String) body.get("telephone");
        String password = passwordEncoder.encode("HRPlatform@2026");

        if ("MANAGER".equals(roleStr) || "ADMIN".equals(roleStr)) {
            Administrateur admin = Administrateur.builder()
                    .nom(nom).prenom(prenom).email(email)
                    .passwordHash(password).telephone(telephone)
                    .role(Role.ADMIN).fonction((String) body.get("poste"))
                    .build();
            return ResponseEntity.ok(adminRepo.save(admin));
        } else {
            String matricule = (String) body.get("matricule");
            if (matricule == null || matricule.isEmpty()) matricule = "EMP-" + System.currentTimeMillis() % 10000;
            
            String dateEmbaucheStr = (String) body.get("dateEmbauche");
            java.time.LocalDate dateEmbauche = dateEmbaucheStr != null ? java.time.LocalDate.parse(dateEmbaucheStr) : java.time.LocalDate.now();

            List<String> competences = List.of();
            if (body.get("competences") instanceof String compsStr && !compsStr.isEmpty()) {
                competences = java.util.Arrays.stream(compsStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());
            }

            User manager = null;
            if (body.get("manager") != null && !body.get("manager").toString().isEmpty()) {
                try {
                    Long mId = Long.parseLong(body.get("manager").toString());
                    manager = userRepo.findById(mId).orElse(null);
                } catch (Exception e) {}
            }

            Employe emp = Employe.builder()
                    .nom(nom).prenom(prenom).email(email)
                    .passwordHash(password).telephone(telephone)
                    .role(Role.EMPLOYE).poste((String) body.get("poste"))
                    .matricule(matricule)
                    .bureau((String) body.get("bureau"))
                    .manager(manager)
                    .competences(competences)
                    .dateEmbauche(dateEmbauche)
                    .build();
            
            emp = employeRepo.save(emp);

            SoldeConge solde = SoldeConge.builder()
                    .employe(emp).joursAccumules(24).joursRestants(24)
                    .annee(java.time.LocalDate.now().getYear()).build();
            soldeRepo.save(solde);
            
            return ResponseEntity.ok(employeService.toDTO(emp));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<Void> changeRole(@PathVariable Long id, @RequestBody Map<String,String> body) {
        userRepo.findById(id).ifPresent(u -> {
            u.setRole(Role.valueOf(body.get("role")));
            userRepo.save(u);
        });
        return ResponseEntity.ok().build();
    }

    @GetMapping("/logs")
    public ResponseEntity<List<ActivityLog>> getLogs() {
        return ResponseEntity.ok(logRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 50)));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String,Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "totalUsers",   userRepo.count(),
                "activeUsers",  chatWebSocketHandler.getOnlineUsersCount(),
                "security",     "98%",
                "uptime",       "99.9%"
        ));
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Map<String,Object>>> getRoles() {
        return ResponseEntity.ok(List.of(
                Map.of("nom", "MANAGER", "utilisateurs", userRepo.countByRole(Role.ADMIN), "permissions",
                        List.of("Gestion complète", "Configuration système", "Gestion utilisateurs", "Analytics avancés")),
                Map.of("nom", "EMPLOYE", "utilisateurs", userRepo.countByRole(Role.EMPLOYE), "permissions",
                        List.of("Demandes congés", "Création tickets", "Profil personnel", "Messages internes"))
        ));
    }

    @GetMapping("/settings")
    public ResponseEntity<List<Map<String, Object>>> getSettings() {
        return ResponseEntity.ok(List.of(
                Map.of("categorie", "Sécurité", "parametres", List.of(
                        Map.of("nom", "Authentification JWT", "valeur", "Activée", "statut", "actif"),
                        Map.of("nom", "Session timeout", "valeur", "30 minutes", "statut", "actif"),
                        Map.of("nom", "Mot de passe fort", "valeur", "Requis", "statut", "actif")
                )),
                Map.of("categorie", "Notifications", "parametres", List.of(
                        Map.of("nom", "Email automatiques", "valeur", "Activé", "statut", "actif"),
                        Map.of("nom", "Rappels SLA", "valeur", "48 heures", "statut", "actif")
                )),
                Map.of("categorie", "Intégrations", "parametres", List.of(
                        Map.of("nom", "n8n Automation", "valeur", "Connecté", "statut", "actif"),
                        Map.of("nom", "API externe", "valeur", "YOUR_API_KEY_HERE", "statut", "warning")
                ))
        ));
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        return ResponseEntity.ok(Map.of(
                "users", userRepo.count(),
                "announcements", announcementRepo.count(),
                "logs", logRepo.count()
        ));
    }
    @PostMapping("/documents")
    public ResponseEntity<Document> addDocument(@RequestBody Map<String, Object> body) {
        Long employeId = Long.valueOf(body.get("employeId").toString());
        Employe emp = employeRepo.findById(employeId).orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        
        Document doc = Document.builder()
                .employe(emp)
                .fileName((String) body.get("fileName"))
                .fileUrl((String) body.get("fileUrl"))
                .type(com.hrplatform.enums.TypeDocument.valueOf((String) body.get("type")))
                .validated(true)
                .build();
                
        Document saved = documentRepo.save(doc);
        
        // Notify employee
        String docTypeLabel = doc.getType().name().replace("_", " ").toLowerCase();
        notificationService.createNotification(
            emp.getId(),
            null,
            "Un nouveau document (" + docTypeLabel + ") a été ajouté à votre dossier par l'administration.",
            "INTERNE"
        );
        
        return ResponseEntity.ok(saved);
    }
}
