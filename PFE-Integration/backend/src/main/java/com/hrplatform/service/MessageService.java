package com.hrplatform.service;

import com.hrplatform.dto.MessageDTO;
import com.hrplatform.entity.Message;
import com.hrplatform.entity.User;
import com.hrplatform.repository.UserRepository;
import com.hrplatform.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageDTO saveMessage(MessageDTO dto) {
        User sender = userRepository.findById(dto.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(dto.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message msg = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .text(dto.getText())
                .fileUrl(dto.getFileUrl())
                .fileName(dto.getFileName())
                .isRead(false)
                .timestamp(LocalDateTime.now())
                .build();

        Message savedMsg = messageRepository.save(msg);
        return toDTO(savedMsg);
    }

    public List<MessageDTO> getConversation(Long user1, Long user2) {
        return messageRepository.findConversation(user1, user2).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void markAsRead(Long receiverId, Long senderId) {
        List<Message> messages = messageRepository.findConversation(receiverId, senderId);
        for(Message m : messages) {
            if(!m.isRead() && m.getReceiver().getId().equals(receiverId)) {
                m.setRead(true);
            }
        }
    }

    public long getUnreadCount(Long receiverId) {
        return messageRepository.findUnreadMessages(receiverId).size();
    }

    private MessageDTO toDTO(Message m) {
        return MessageDTO.builder()
                .id(m.getId())
                .senderId(m.getSender().getId())
                .receiverId(m.getReceiver().getId())
                .text(m.getText())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .isRead(m.isRead())
                .timestamp(m.getTimestamp())
                .build();
    }
}
