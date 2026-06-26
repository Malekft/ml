package com.hrplatform.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageDTO {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String text;
    private String fileUrl;
    private String fileName;
    private boolean isRead;
    private LocalDateTime timestamp;
}
