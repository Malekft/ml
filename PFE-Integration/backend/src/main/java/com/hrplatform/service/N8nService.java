package com.hrplatform.service;

import com.hrplatform.entity.Announcement;
import com.hrplatform.enums.Plateforme;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class N8nService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final String n8nWebhookUrl = "http://localhost:5678/webhook/announcement-publish";

    public void sendAnnouncementToN8n(Announcement announcement) {
        if (announcement.getPlatforms() == null || announcement.getPlatforms().isEmpty()) {
            return;
        }

        // Filter only external platforms for n8n
        var externalPlatforms = announcement.getPlatforms().stream()
                .filter(p -> p == Plateforme.FACEBOOK || p == Plateforme.LINKEDIN)
                .map(Enum::name)
                .collect(Collectors.toList());

        if (externalPlatforms.isEmpty()) {
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", announcement.getId());
        payload.put("title", announcement.getTitle());
        payload.put("content", announcement.getContent());
        payload.put("category", announcement.getCategory());
        payload.put("platforms", externalPlatforms);
        payload.put("author", announcement.getAuthor().getPrenom() + " " + announcement.getAuthor().getNom());

        try {
            restTemplate.postForEntity(n8nWebhookUrl, payload, String.class);
            System.out.println("Announcement sent to n8n: " + announcement.getTitle());
        } catch (Exception e) {
            System.err.println("Failed to send announcement to n8n: " + e.getMessage());
        }
    }
}
