package com.hrplatform.repository;

import com.hrplatform.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :user1 AND m.receiver.id = :user2) OR (m.sender.id = :user2 AND m.receiver.id = :user1) ORDER BY m.timestamp ASC")
    List<Message> findConversation(Long user1, Long user2);

    @Query("SELECT m FROM Message m WHERE m.receiver.id = :receiverId AND m.isRead = false")
    List<Message> findUnreadMessages(Long receiverId);
}
