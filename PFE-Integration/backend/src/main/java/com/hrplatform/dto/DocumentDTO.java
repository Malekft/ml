package com.hrplatform.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class DocumentDTO {
    private Long id;
    private String fileName;
    private String fileUrl;
    private String type;
    private LocalDateTime uploadedAt;
    private Boolean validated;
}
