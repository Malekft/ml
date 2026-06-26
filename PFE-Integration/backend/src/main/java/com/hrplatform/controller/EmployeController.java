package com.hrplatform.controller;

import com.hrplatform.dto.EmployeDTO;
import com.hrplatform.entity.*;
import com.hrplatform.enums.Role;
import com.hrplatform.repository.*;
import com.hrplatform.service.EmployeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController @RequestMapping("/employes") @RequiredArgsConstructor
public class EmployeController {
    private final EmployeService employeService;
    private final EmployeRepository employeRepo;
    private final SoldeCongeRepository soldeRepo;
    private final PasswordEncoder passwordEncoder;
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final UserRepository userRepo;

    @GetMapping
    public ResponseEntity<List<EmployeDTO>> getAll() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isManagerOrAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER") || a.getAuthority().equals("ROLE_ADMIN"));
            
        List<EmployeDTO> all = employeService.findAll();
        all.forEach(e -> e.setIsOnline(chatWebSocketHandler.isUserOnline(e.getId())));
        
        if (isManagerOrAdmin) {
            return ResponseEntity.ok(all);
        } else {
            String currentEmail = auth.getName();
            List<EmployeDTO> filtered = all.stream()
                .filter(e -> e.getEmail().equals(currentEmail))
                .collect(Collectors.toList());
            return ResponseEntity.ok(filtered);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeDTO> getById(@PathVariable Long id) {
        EmployeDTO dto = employeService.findById(id);
        dto.setIsOnline(chatWebSocketHandler.isUserOnline(id));
        if (!isAuthorized(dto.getEmail())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<EmployeDTO> create(@RequestBody Map<String,Object> body) {
        User manager = null;
        if (body.get("manager") != null && !body.get("manager").toString().isEmpty()) {
            try {
                Long mId = Long.parseLong(body.get("manager").toString());
                manager = userRepo.findById(mId).orElse(null);
            } catch (Exception e) {}
        }

        Employe emp = Employe.builder()
                .nom((String) body.get("nom"))
                .prenom((String) body.get("prenom"))
                .email((String) body.get("email"))
                .passwordHash(passwordEncoder.encode("Employe@1234"))
                .telephone((String) body.get("telephone"))
                .role(Role.EMPLOYE)
                .matricule((String) body.get("matricule"))
                .poste((String) body.get("poste"))
                .bureau((String) body.get("bureau"))
                .manager(manager)
                .dateEmbauche(body.get("dateEmbauche") != null ? LocalDate.parse((String) body.get("dateEmbauche")) : LocalDate.now())
                .competences(body.get("competences") != null
                    ? java.util.Arrays.stream(((String) body.get("competences")).split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList())
                    : java.util.List.of())
                .build();
        
        emp = employeRepo.save(emp);

        SoldeConge solde = SoldeConge.builder()
                .employe(emp).joursAccumules(24).joursRestants(24)
                .annee(LocalDate.now().getYear()).build();
        soldeRepo.save(solde);
        
        return ResponseEntity.ok(employeService.toDTO(emp));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeDTO> update(@PathVariable Long id, @RequestBody Map<String,Object> body) {
        Employe emp = employeRepo.findById(id).orElseThrow();
        if (!isAuthorized(emp.getEmail())) {
            return ResponseEntity.status(403).build();
        }
        if (body.get("poste") != null) emp.setPoste((String) body.get("poste"));
        if (body.get("telephone") != null) emp.setTelephone((String) body.get("telephone"));
        if (body.get("nom") != null) emp.setNom((String) body.get("nom"));
        if (body.get("prenom") != null) emp.setPrenom((String) body.get("prenom"));
        if (body.get("matricule") != null) emp.setMatricule((String) body.get("matricule"));
        if (body.get("bureau") != null) emp.setBureau((String) body.get("bureau"));
        if (body.get("manager") != null && !body.get("manager").toString().isEmpty()) {
            try {
                Long mId = Long.parseLong(body.get("manager").toString());
                emp.setManager(userRepo.findById(mId).orElse(null));
            } catch (Exception e) {}
        }
        if (body.get("dateEmbauche") != null) {
            emp.setDateEmbauche(LocalDate.parse((String) body.get("dateEmbauche")));
        }
        if (body.get("competences") != null) {
            String raw = (String) body.get("competences");
            emp.setCompetences(java.util.Arrays.stream(raw.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList()));
        }
        
        return ResponseEntity.ok(employeService.toDTO(employeRepo.save(emp)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isManagerOrAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER") || a.getAuthority().equals("ROLE_ADMIN"));
        if (!isManagerOrAdmin) {
            return ResponseEntity.status(403).build();
        }
        employeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isAuthorized(String targetEmail) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        boolean isManagerOrAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER") || a.getAuthority().equals("ROLE_ADMIN"));
        return isManagerOrAdmin || auth.getName().equals(targetEmail);
    }
}
