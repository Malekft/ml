package com.hrplatform.controller;

import com.hrplatform.dto.DemandeDTO;
import com.hrplatform.service.DemandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/demandes")
@RequiredArgsConstructor
public class DemandeController {
    private final DemandeService demandeService;

    @GetMapping
    public ResponseEntity<List<DemandeDTO>> getAll() {
        return ResponseEntity.ok(demandeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DemandeDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.findById(id));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<List<DemandeDTO>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(demandeService.findByEmployeId(employeId));
    }

    @PostMapping
    public ResponseEntity<DemandeDTO> create(@RequestBody DemandeDTO dto) {
        return ResponseEntity.ok(demandeService.create(dto));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<DemandeDTO> approve(@PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(demandeService.approve(id, body.get("adminEmployeId")));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<DemandeDTO> reject(@PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long adminId = Long.parseLong(body.get("adminEmployeId").toString());
        String motif = (String) body.get("motif");
        return ResponseEntity.ok(demandeService.reject(id, adminId, motif));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id, @RequestParam Long employeId) {
        demandeService.cancel(id, employeId);
        return ResponseEntity.ok().build();
    }
}
