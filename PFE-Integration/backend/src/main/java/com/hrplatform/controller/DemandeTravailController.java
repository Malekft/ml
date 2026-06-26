package com.hrplatform.controller;

import com.hrplatform.dto.DemandeDTO;
import com.hrplatform.service.DemandeTravailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/travail-supp")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemandeTravailController {
    private final DemandeTravailService travailService;

    @GetMapping("/employe/{id}")
    public ResponseEntity<List<DemandeDTO>> getByEmploye(@PathVariable Long id) {
        return ResponseEntity.ok(travailService.findByEmployeId(id));
    }

    @GetMapping
    public ResponseEntity<List<DemandeDTO>> getAll() {
        return ResponseEntity.ok(travailService.findAll());
    }

    @PostMapping
    public ResponseEntity<DemandeDTO> create(@RequestBody DemandeDTO dto) {
        return ResponseEntity.ok(travailService.create(dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DemandeDTO> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        com.hrplatform.enums.StatutDemande newStatut = com.hrplatform.enums.StatutDemande.valueOf(body.get("statut"));
        return ResponseEntity.ok(travailService.updateStatus(id, newStatut));
    }
}
