package com.hrplatform.controller;

import com.hrplatform.service.MlPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ml")
@RequiredArgsConstructor
public class MlController {

    private final MlPredictionService mlPredictionService;

    @PostMapping("/predict-proximity")
    public ResponseEntity<Map<String, Object>> predictProximity(@RequestBody Map<String, Object> absenceData) {
        return ResponseEntity.ok(mlPredictionService.predictProximity(absenceData));
    }

    @PostMapping("/detect-suspicious")
    public ResponseEntity<Map<String, Object>> detectSuspicious(@RequestBody Map<String, Object> absenceData) {
        return ResponseEntity.ok(mlPredictionService.detectSuspicious(absenceData));
    }
}
