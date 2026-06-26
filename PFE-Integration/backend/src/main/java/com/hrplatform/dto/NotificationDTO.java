package com.hrplatform.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class NotificationDTO {
    private Long id;
    private Long userId;
    private Long demandeId;
    private String message;
    private String type;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
