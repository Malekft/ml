package com.hrplatform.controller;

import com.hrplatform.entity.*;
import com.hrplatform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

import com.hrplatform.dto.DemandeDTO;
import com.hrplatform.service.DemandeService;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/conges")
@RequiredArgsConstructor
public class CongeController {
    private final TypeCongeRepository typeCongeRepo;
    private final SousTypeCongeRepository sousTypeRepo;
    private final SoldeCongeRepository soldeRepo;
    private final DemandeService demandeService;

    @GetMapping("/types")
    public ResponseEntity<List<TypeConge>> getTypes() {
        return ResponseEntity.ok(typeCongeRepo.findAll());
    }

    @GetMapping("/types/{id}/sous-types")
    public ResponseEntity<List<SousTypeConge>> getSousTypes(@PathVariable Long id) {
        return ResponseEntity.ok(sousTypeRepo.findByTypeCongeId(id));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<List<DemandeDTO>> getCongesByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(demandeService.findCongesByEmployeId(employeId));
    }

    @GetMapping("/solde/{employeId}")
    public ResponseEntity<Map<String, Integer>> getSolde(@PathVariable Long employeId) {
        return soldeRepo.findByEmployeId(employeId)
                .map(s -> ResponseEntity.ok(Map.of(
                        "joursAccumules", s.getJoursAccumules(),
                        "joursRestants", s.getJoursRestants(),
                        "heuresSortie", s.getHeuresSortie() != null ? s.getHeuresSortie() : 0,
                        "annee", s.getAnnee())))
                .orElse(ResponseEntity.notFound().build());
    }
}
