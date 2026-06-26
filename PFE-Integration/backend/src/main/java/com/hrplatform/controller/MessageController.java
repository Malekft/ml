package com.hrplatform.controller;

import com.hrplatform.dto.MessageDTO;
import com.hrplatform.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*") 
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/messages/{user1}/{user2}")
    public ResponseEntity<List<MessageDTO>> getConversation(
            @PathVariable Long user1, 
            @PathVariable Long user2) {
        return ResponseEntity.ok(messageService.getConversation(user1, user2));
    }

    @PutMapping("/messages/read/{receiverId}/{senderId}")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long receiverId, 
            @PathVariable Long senderId) {
        messageService.markAsRead(receiverId, senderId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/messages/unread/{receiverId}")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long receiverId) {
        return ResponseEntity.ok(messageService.getUnreadCount(receiverId));
    }
}
