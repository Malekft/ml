package com.hrplatform.controller;

import com.hrplatform.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/analytics") @RequiredArgsConstructor
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/leave-prediction")
    public ResponseEntity<Map<String, Object>> getLeavePrediction() {
        return ResponseEntity.ok(analyticsService.getLeavePrediction());
    }

    @GetMapping("/workload-prediction")
    public ResponseEntity<Map<String, Object>> getWorkloadPrediction() {
        return ResponseEntity.ok(analyticsService.getWorkloadPrediction());
    }

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getKpis() {
        return ResponseEntity.ok(analyticsService.getKpis());
    }
}
