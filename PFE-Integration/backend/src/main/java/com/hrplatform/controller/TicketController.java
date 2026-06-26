package com.hrplatform.controller;

import com.hrplatform.dto.TicketDTO;
import com.hrplatform.enums.StatutDemande;
import com.hrplatform.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/tickets") @RequiredArgsConstructor
public class TicketController {
    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<TicketDTO>> getAll() {
        return ResponseEntity.ok(ticketService.findAll());
    }

    @GetMapping("/employe/{id}")
    public ResponseEntity<List<TicketDTO>> getByEmploye(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.findByEmployeId(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TicketDTO> create(@RequestBody TicketDTO dto) {
        return ResponseEntity.ok(ticketService.create(dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TicketDTO> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ticketService.updateStatus(id, StatutDemande.valueOf(body.get("statut"))));
    }

    @PutMapping("/{id}/take")
    public ResponseEntity<TicketDTO> take(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.updateStatus(id, StatutDemande.IN_PROGRESS));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<TicketDTO> resolve(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.updateStatus(id, StatutDemande.RESOLU));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<TicketDTO> close(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.updateStatus(id, StatutDemande.FERME));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ticketService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
