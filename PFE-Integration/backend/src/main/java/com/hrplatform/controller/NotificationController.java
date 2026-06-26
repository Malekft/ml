package com.hrplatform.controller;

import com.hrplatform.dto.NotificationDTO;
import com.hrplatform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notifService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationDTO>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notifService.findByUserId(userId));
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>> countUnread(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("count", notifService.countUnread(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notifService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllRead(@PathVariable Long userId) {
        notifService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
