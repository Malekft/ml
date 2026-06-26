package com.hrplatform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrplatform.dto.MessageDTO;
import com.hrplatform.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final MessageService messageService;
    private final com.hrplatform.repository.UserRepository userRepo;
    
    // Mapping pour stocker la session associée à chaque ID d'employé
    private final Map<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public boolean isUserOnline(Long userId) {
        return userSessions.containsKey(userId);
    }

    public long getOnlineUsersCount() {
        if (userSessions.isEmpty()) return 0;
        return userRepo.findAllById(userSessions.keySet()).stream()
                .filter(u -> u.getRole() == com.hrplatform.enums.Role.EMPLOYE)
                .count();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // Le client va nous envoyer un message d'initialisation avec son ID, on peut aussi l'extraire de l'URL si besoin
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        
        // Skip Heartbeats
        if ("PING".equals(payload)) return;
        
        // 1. Gérer l'enregistrement de l'utilisateur (Connexion)
        if (payload.startsWith("REGISTER:")) {
            Long userId = Long.parseLong(payload.split(":")[1]);
            userSessions.put(userId, session);
            session.getAttributes().put("userId", userId);
            System.out.println("WebSocket Live: User " + userId + " connected.");
            
            // Envoyer la liste des personnes en ligne à l'utilisateur qui vient de se connecter
            broadcastPresence(userId, true);
            sendCurrentOnlineUsers(session);
            return;
        }
        
        // 2. Gérer le routage d'un vrai message de chat ou signal
        Map<String, Object> data = mapper.readValue(payload, Map.class);
        String type = (String) data.get("type");

        if ("SIGNAL".equals(type)) {
            // C'est un signal WebRTC ou une alerte d'appel -> On route sans sauver
            Long receiverId = ((Number) data.get("receiverId")).longValue();
            WebSocketSession receiverSession = userSessions.get(receiverId);
            if (receiverSession != null && receiverSession.isOpen()) {
                synchronized (receiverSession) {
                    receiverSession.sendMessage(new TextMessage(payload));
                }
            }
            return;
        }

        // Sinon, c'est un message de chat normal
        MessageDTO dto = mapper.convertValue(data, MessageDTO.class);

        
        // Sauvegarde en base SQL
        MessageDTO savedDto = messageService.saveMessage(dto);
        String savedPayload = mapper.writeValueAsString(savedDto);
        TextMessage responseMessage = new TextMessage(savedPayload);
        
        // Envoi au destinataire s'il est en ligne
        WebSocketSession receiverSession = userSessions.get(savedDto.getReceiverId());
        if (receiverSession != null && receiverSession.isOpen()) {
            synchronized (receiverSession) {
                receiverSession.sendMessage(responseMessage);
            }
        }
        
        // Renvoi à l'expéditeur (pour accuser réception / confirmation temps réel)
        if (session.isOpen()) {
            synchronized (session) {
                session.sendMessage(responseMessage);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        
        if (userId != null) {
            // Uniquement supprimer si c'est bien CETTE session qui est dans le map
            // (évite de virer une nouvelle session après un refresh)
            boolean removed = userSessions.remove(userId, session);
            if (removed) {
                broadcastPresence(userId, false);
                System.out.println("WebSocket Live: User " + userId + " is now OFFLINE.");
            }
        }
    }

    private void broadcastPresence(Long userId, boolean online) {
        String msg = String.format("{\"type\":\"PRESENCE\",\"userId\":%d,\"online\":%b}", userId, online);
        TextMessage textMessage = new TextMessage(msg);
        for (WebSocketSession s : userSessions.values()) {
            try {
                if (s.isOpen()) {
                    synchronized (s) {
                        s.sendMessage(textMessage);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void sendCurrentOnlineUsers(WebSocketSession session) {
        try {
            String ids = userSessions.keySet().toString();
            String msg = String.format("{\"type\":\"ONLINE_LIST\",\"users\":%s}", ids);
            if (session.isOpen()) {
                synchronized (session) {
                    session.sendMessage(new TextMessage(msg));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
