package com.hrplatform.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AutorisationSortieDTO {
    private Long id;
    private Long employeId;
    private String employeNom;
    private String employePrenom;
    private Integer heures;
    private LocalDate dateAutorisation;
    private LocalDateTime dateSaisie;
    private String email;
    private String avatar;
}
