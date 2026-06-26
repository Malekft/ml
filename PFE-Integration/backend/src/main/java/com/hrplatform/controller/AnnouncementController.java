package com.hrplatform.controller;

import com.hrplatform.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/announcements") @RequiredArgsConstructor
public class AnnouncementController {
    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            return ResponseEntity.ok(announcementService.findAllForUserId(userId));
        }
        return ResponseEntity.ok(announcementService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(announcementService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body,
            @RequestParam(defaultValue = "1") Long authorId) {
        return ResponseEntity.ok(announcementService.create(body, authorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(announcementService.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(announcementService.stats());
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long id, @RequestParam(required = false) Long userId, @RequestParam(defaultValue = "LIKE") String type) {
        try {
            if (userId == null || userId <= 0) {
                userId = getAuthenticatedUserId();
            }
            return ResponseEntity.ok(announcementService.toggleLike(id, userId, type));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestParam(required = false) Long userId, @RequestBody Map<String, String> body) {
        try {
            if (userId == null || userId <= 0) {
                userId = getAuthenticatedUserId();
            }
            return ResponseEntity.ok(announcementService.addComment(id, userId, body.get("content"), body.get("fileName"), body.get("fileUrl")));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> toggleCommentLike(@PathVariable Long commentId, @RequestParam(required = false) Long userId, @RequestParam(defaultValue = "LIKE") String type) {
        try {
            if (userId == null || userId <= 0) {
                userId = getAuthenticatedUserId();
            }
            return ResponseEntity.ok(announcementService.toggleCommentLike(commentId, userId, type));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private Long getAuthenticatedUserId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new RuntimeException("Votre session a expiré. Veuillez vous reconnecter.");
        String email = auth.getName();
        Long userId = announcementService.getUserIdByEmail(email);
        if (userId == null || userId <= 0) {
            throw new RuntimeException("Utilisateur introuvable dans la base de données. Veuillez vous reconnecter pour rafraîchir votre compte.");
        }
        return userId;
    }

    @PostMapping("/comments/{commentId}/reply")
    public ResponseEntity<?> addReply(@PathVariable Long commentId, @RequestParam(required = false) Long userId, @RequestBody Map<String, String> body) {
        try {
            if (userId == null || userId <= 0) {
                userId = getAuthenticatedUserId();
            }
            return ResponseEntity.ok(announcementService.addReply(commentId, userId, body.get("content"), body.get("fileName"), body.get("fileUrl")));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, @RequestParam(required = false) Long userId) {
        try {
            if (userId == null || userId <= 0) userId = getAuthenticatedUserId();
            announcementService.deleteComment(commentId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Long commentId, @RequestParam(required = false) Long userId, @RequestBody Map<String, String> body) {
        try {
            if (userId == null || userId <= 0) userId = getAuthenticatedUserId();
            return ResponseEntity.ok(announcementService.updateComment(commentId, body.get("content"), body.get("fileName"), body.get("fileUrl"), userId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
