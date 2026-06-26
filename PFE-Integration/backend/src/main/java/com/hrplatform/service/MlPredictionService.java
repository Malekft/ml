package com.hrplatform.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MlPredictionService {

    private final RestTemplate restTemplate = new RestTemplate();
    
    // We assume the Flask API is running locally on port 5000
    private final String flaskApiUrl = "http://localhost:5000/api";

    public Map<String, Object> predictProximity(Map<String, Object> absenceData) {
        String url = flaskApiUrl + "/predict_proximity";
        ResponseEntity<Map> response = restTemplate.postForEntity(url, absenceData, Map.class);
        return response.getBody();
    }

    public Map<String, Object> detectSuspicious(Map<String, Object> absenceData) {
        String url = flaskApiUrl + "/detect_suspicious";
        ResponseEntity<Map> response = restTemplate.postForEntity(url, absenceData, Map.class);
        return response.getBody();
    }
}
