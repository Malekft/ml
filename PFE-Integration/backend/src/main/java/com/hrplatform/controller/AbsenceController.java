package com.hrplatform.controller;

import com.hrplatform.dto.AbsenceDTO;
import com.hrplatform.service.AbsenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/absences")
@RequiredArgsConstructor
public class AbsenceController {
    private final AbsenceService absenceService;

    @GetMapping("/employe/{id}")
    public ResponseEntity<List<AbsenceDTO>> getByEmploye(@PathVariable Long id) {
        return ResponseEntity.ok(absenceService.findByEmployeId(id));
    }

    @GetMapping
    public ResponseEntity<List<AbsenceDTO>> getAll() {
        return ResponseEntity.ok(absenceService.findAll());
    }

    @PostMapping
    public ResponseEntity<AbsenceDTO> create(@RequestBody Map<String, Object> body) {
        Long employeId = Long.valueOf(body.get("employeId").toString());
        LocalDateTime start = LocalDateTime.parse(body.get("dateDebut").toString());
        LocalDateTime end = LocalDateTime.parse(body.get("dateFin").toString());
        String type = (String) body.get("type");
        return ResponseEntity.ok(absenceService.addAbsence(employeId, start, end, type));
    }

    @PutMapping("/{id}/justify")
    public ResponseEntity<AbsenceDTO> justify(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(absenceService.justifyAbsence(id, body.get("justificatifUrl")));
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<AbsenceDTO> validate(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(absenceService.validateJustification(id, body.get("approved")));
    }
}
