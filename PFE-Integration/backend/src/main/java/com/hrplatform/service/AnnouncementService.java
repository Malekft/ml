package com.hrplatform.service;

import com.hrplatform.entity.*;
import com.hrplatform.enums.*;
import com.hrplatform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.scheduling.annotation.Scheduled;

@Service @RequiredArgsConstructor @Transactional
public class AnnouncementService {
    private final AnnouncementRepository announcementRepo;
    private final AnnouncementCommentRepository announcementCommentRepo;
    private final UserRepository userRepo;
    private final EmployeRepository employeRepo;
    private final NotificationService notificationService;
    private final N8nService n8nService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> findAll() {
        return announcementRepo.findAllByOrderByCreatedAtDesc().stream().map(a -> toDto(a, 0L)).collect(Collectors.toList());
    }

    public List<Map<String, Object>> findAllForUser(User user) {
        if (user.getRole() == Role.ADMIN) {
            return announcementRepo.findAllByOrderByCreatedAtDesc().stream()
                    .map(a -> toDto(a, user.getId()))
                    .collect(Collectors.toList());
        } else {
            LocalDateTime now = LocalDateTime.now();
            return announcementRepo.findAllByOrderByCreatedAtDesc().stream()
                    .filter(a -> {
                        boolean isInternal = a.getCategory() == null || a.getCategory() == AnnouncementCategory.INTERNE;
                        boolean isPublished = a.getStatus() == AnnouncementStatus.PUBLISHED;
                        boolean isScheduledAndPast = a.getStatus() == AnnouncementStatus.SCHEDULED 
                                && a.getScheduledDate() != null 
                                && a.getScheduledDate().isBefore(now);
                        return isInternal && (isPublished || isScheduledAndPast);
                    })
                    .map(a -> toDto(a, user.getId()))
                    .collect(Collectors.toList());
        }
    }

    public List<Map<String, Object>> findAllForUserId(Long userId) {
        if (userId == null || userId <= 0) {
            return List.of();
        }
        try {
            User user = userRepo.findById(userId).orElse(null);
            if (user == null) return List.of();
            return findAllForUser(user);
        } catch (Exception e) {
            return List.of();
        }
    }

    public Map<String, Object> findById(Long id) {
        return toDto(announcementRepo.findById(id).orElseThrow(), 0L);
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> payload, Long authorId) {
        User author = userRepo.findById(authorId).orElseThrow();
        Announcement a = Announcement.builder()
                .author(author)
                .title((String) payload.get("title"))
                .content((String) payload.get("content"))
                .category(AnnouncementCategory.valueOf(String.valueOf(payload.getOrDefault("category", "INTERNE"))))
                .status(AnnouncementStatus.valueOf(String.valueOf(payload.getOrDefault("status", "PUBLISHED"))))
                .build();
        if (payload.get("scheduledDate") != null && !String.valueOf(payload.get("scheduledDate")).isBlank()) {
            a.setScheduledDate(LocalDateTime.parse(String.valueOf(payload.get("scheduledDate"))));
        }
        if (payload.get("platforms") instanceof List<?> platforms) {
            a.setPlatforms(platforms.stream()
                .map(p -> Plateforme.valueOf(String.valueOf(p).toUpperCase()))
                .collect(Collectors.toList()));
        }
        a.setAuthor(author);
        Announcement saved = announcementRepo.save(a);

        if (saved.getStatus() == AnnouncementStatus.PUBLISHED) {
            notifyAllEmployees(saved);
            n8nService.sendAnnouncementToN8n(saved);
        }

        return toDto(saved, authorId);
    }

    private void notifyAllEmployees(Announcement a) {
        String msg = "Nouvelle annonce : " + a.getTitle();
        String category = a.getCategory() != null ? a.getCategory().name() : "INTERNE";
        employeRepo.findAll().forEach(emp -> {
            notificationService.createNotification(emp.getId(), null, msg, category);
        });
    }

    @Transactional
    public Map<String, Object> update(Long id, Map<String, Object> payload) {
        Announcement a = announcementRepo.findById(id).orElseThrow();
        if (payload.get("title") != null) a.setTitle((String) payload.get("title"));
        if (payload.get("content") != null) a.setContent((String) payload.get("content"));
        if (payload.get("category") != null) {
            a.setCategory(AnnouncementCategory.valueOf(String.valueOf(payload.get("category"))));
        }
        if (payload.get("status") != null) {
            a.setStatus(AnnouncementStatus.valueOf(String.valueOf(payload.get("status"))));
        }
        if (payload.get("scheduledDate") != null && !String.valueOf(payload.get("scheduledDate")).isBlank()) {
            a.setScheduledDate(LocalDateTime.parse(String.valueOf(payload.get("scheduledDate"))));
        }
        if (payload.get("platforms") instanceof List<?> platforms) {
            a.setPlatforms(platforms.stream()
                .map(p -> Plateforme.valueOf(String.valueOf(p).toUpperCase()))
                .collect(Collectors.toList()));
        }
        
        AnnouncementStatus oldStatus = a.getStatus();
        Announcement saved = announcementRepo.save(a);
        
        if (saved.getStatus() == AnnouncementStatus.PUBLISHED && oldStatus != AnnouncementStatus.PUBLISHED) {
            notifyAllEmployees(saved);
            n8nService.sendAnnouncementToN8n(saved);
        }

        return toDto(saved, 0L);
    }

    @Transactional
    public void delete(Long id) { announcementRepo.deleteById(id); }

    @Transactional
    public Map<String, Object> toggleLike(Long announcementId, Long userId, String type) {
        // Migration: Ensure column exists
        try {
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('announcement_likes') AND name = 'reaction_type') ALTER TABLE announcement_likes ADD reaction_type NVARCHAR(20) DEFAULT 'LIKE'");
        } catch (Exception e) {}

        String checkSql = "SELECT reaction_type FROM announcement_likes WHERE announcement_id = ? AND user_id = ?";
        List<String> existing = jdbcTemplate.queryForList(checkSql, String.class, announcementId, userId);
        
        if (!existing.isEmpty()) {
            String currentType = existing.get(0);
            jdbcTemplate.update("DELETE FROM announcement_likes WHERE announcement_id = ? AND user_id = ?", announcementId, userId);
            // If clicking the same reaction, we just remove it. If clicking a different one, we remove old and add new.
            if (!currentType.equalsIgnoreCase(type)) {
                jdbcTemplate.update("INSERT INTO announcement_likes (announcement_id, user_id, reaction_type) VALUES (?, ?, ?)", announcementId, userId, type.toUpperCase());
            }
        } else {
            jdbcTemplate.update("INSERT INTO announcement_likes (announcement_id, user_id, reaction_type) VALUES (?, ?, ?)", announcementId, userId, type.toUpperCase());
        }
        
        return getReactionStats("announcement_likes", "announcement_id", announcementId, userId);
    }

    private Map<String, Object> getReactionStats(String table, String idColumn, Long idValue, Long userId) {
        try {
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('" + table + "') AND name = 'reaction_type') ALTER TABLE " + table + " ADD reaction_type NVARCHAR(20) DEFAULT 'LIKE'");
        } catch (Exception e) {}

        String query = "SELECT r.reaction_type, r.user_id, u.prenom, u.nom " +
                       "FROM " + table + " r " +
                       "JOIN users u ON r.user_id = u.id " +
                       "WHERE r." + idColumn + " = ?";
        
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(query, idValue);
        
        Map<String, Integer> breakdown = new HashMap<>();
        Map<String, List<String>> namesByType = new HashMap<>();
        String userReaction = null;
        int total = 0;

        for (Map<String, Object> row : rows) {
            String type = String.valueOf(row.get("reaction_type")).toUpperCase();
            Long rUserId = ((Number) row.get("user_id")).longValue();
            String name = (row.get("prenom") + " " + row.get("nom")).trim();
            
            breakdown.put(type, breakdown.getOrDefault(type, 0) + 1);
            namesByType.computeIfAbsent(type, k -> new ArrayList<>()).add(name);
            total++;
            
            if (userId != null && userId.equals(rUserId)) {
                userReaction = type;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("breakdown", breakdown);
        stats.put("userReaction", userReaction);
        stats.put("namesByType", namesByType);
        return stats;
    }

    @Transactional
    public Map<String, Object> addComment(Long announcementId, Long userId, String content, String fileName, String fileUrl) {
        Announcement a = announcementRepo.findById(announcementId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();
        AnnouncementComment comment = AnnouncementComment.builder()
                .announcement(a)
                .author(user)
                .content(content)
                .fileName(fileName)
                .fileUrl(fileUrl)
                .build();
        a.getComments().add(comment);
        return commentToDto(announcementRepo.save(a).getComments().stream().filter(c -> c.getContent().equals(content) && c.getAuthor().getId().equals(userId)).findFirst().orElse(comment), userId);
    }

    @Transactional
    public Map<String, Object> toggleCommentLike(Long commentId, Long userId, String type) {
        // Migration: Ensure column exists
        try {
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('comment_likes') AND name = 'reaction_type') ALTER TABLE comment_likes ADD reaction_type NVARCHAR(20) DEFAULT 'LIKE'");
        } catch (Exception e) {}

        String checkSql = "SELECT reaction_type FROM comment_likes WHERE comment_id = ? AND user_id = ?";
        List<String> existing = jdbcTemplate.queryForList(checkSql, String.class, commentId, userId);
        
        if (!existing.isEmpty()) {
            String currentType = existing.get(0);
            jdbcTemplate.update("DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?", commentId, userId);
            if (!currentType.equalsIgnoreCase(type)) {
                jdbcTemplate.update("INSERT INTO comment_likes (comment_id, user_id, reaction_type) VALUES (?, ?, ?)", commentId, userId, type.toUpperCase());
            }
        } else {
            jdbcTemplate.update("INSERT INTO comment_likes (comment_id, user_id, reaction_type) VALUES (?, ?, ?)", commentId, userId, type.toUpperCase());
        }
        
        return getReactionStats("comment_likes", "comment_id", commentId, userId);
    }

    @Transactional
    public Map<String, Object> addReply(Long commentId, Long userId, String content, String fileName, String fileUrl) {
        AnnouncementComment parent = announcementCommentRepo.findById(commentId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();
        AnnouncementComment reply = AnnouncementComment.builder()
                .announcement(parent.getAnnouncement())
                .author(user)
                .content(content)
                .parent(parent)
                .fileName(fileName)
                .fileUrl(fileUrl)
                .build();
        parent.getReplies().add(reply);
        return commentToDto(announcementCommentRepo.save(parent).getReplies().stream().filter(r -> r.getContent().equals(content) && r.getAuthor().getId().equals(userId)).findFirst().orElse(reply), userId);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        jdbcTemplate.update("DELETE FROM comment_likes WHERE comment_id = ?", commentId);
        announcementCommentRepo.deleteById(commentId);
    }

    @Transactional
    public Map<String, Object> updateComment(Long commentId, String content, String fileName, String fileUrl, Long userId) {
        AnnouncementComment c = announcementCommentRepo.findById(commentId).orElseThrow();
        if (!c.getAuthor().getId().equals(userId)) throw new RuntimeException("Unauthorized");
        c.setContent(content);
        if (fileName != null) c.setFileName(fileName);
        if (fileUrl != null) c.setFileUrl(fileUrl);
        return commentToDto(announcementCommentRepo.save(c), userId);
    }

    public Map<String, Object> stats() {
        return Map.of(
                "total", announcementRepo.count(),
                "internal", announcementRepo.findAll().stream().filter(a -> a.getCategory() == AnnouncementCategory.INTERNE).count(),
                "external", announcementRepo.findAll().stream().filter(a -> a.getCategory() == AnnouncementCategory.EXTERNE).count(),
                "scheduled", announcementRepo.countByStatus(AnnouncementStatus.SCHEDULED)
        );
    }

    private Map<String, Object> toDto(Announcement a, Long userId) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", a.getId());
        map.put("title", a.getTitle() != null ? a.getTitle() : "");
        map.put("content", a.getContent() != null ? a.getContent() : "");
        map.put("author", a.getAuthor() == null ? "Management" : a.getAuthor().getPrenom() + " " + a.getAuthor().getNom());
        map.put("email", a.getAuthor() == null ? "management@hrplatform.com" : a.getAuthor().getEmail());
        map.put("authorId", a.getAuthor() == null ? 0L : a.getAuthor().getId());
        map.put("avatar", a.getAuthor() == null ? User.generateAvatar("management@hrplatform.com") : (a.getAuthor().getAvatar() != null ? a.getAuthor().getAvatar() : User.generateAvatar(a.getAuthor().getEmail())));
        map.put("date", a.getCreatedAt() == null ? "" : a.getCreatedAt().toLocalDate().toString());
        map.put("category", a.getCategory() != null ? a.getCategory().name() : "INTERNE");
        map.put("status", a.getStatus() != null ? a.getStatus().name() : "PUBLISHED");
        map.put("scheduledDate", a.getScheduledDate() == null ? "" : a.getScheduledDate().toString());
        
        map.put("reactions", getReactionStats("announcement_likes", "announcement_id", a.getId(), userId));

        map.put("comments", a.getComments().stream()
            .filter(c -> c.getParent() == null)
            .map(c -> commentToDto(c, userId))
            .collect(Collectors.toList()));
        
        return map;
    }

    private Map<String, Object> commentToDto(AnnouncementComment c, Long userId) {
        Map<String, Object> cm = new HashMap<>();
        cm.put("id", c.getId());
        cm.put("author", (c.getAuthor().getPrenom() + " " + c.getAuthor().getNom()).trim());
        cm.put("avatar", c.getAuthor().getAvatar() != null ? c.getAuthor().getAvatar() : User.generateAvatar(c.getAuthor().getEmail()));
        cm.put("email", c.getAuthor().getEmail());
        cm.put("authorId", c.getAuthor().getId());
        cm.put("text", c.getContent());
        cm.put("fileName", c.getFileName());
        cm.put("fileUrl", c.getFileUrl());
        
        cm.put("reactions", getReactionStats("comment_likes", "comment_id", c.getId(), userId));
        
        String formattedDate = "";
        if (c.getCreatedAt() != null) {
            formattedDate = c.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        }
        cm.put("date", formattedDate);
        
        cm.put("replies", c.getReplies().stream()
            .map(r -> commentToDto(r, userId))
            .collect(Collectors.toList()));
            
        return cm;
    }

    public Long getUserIdByEmail(String email) {
        return userRepo.findByEmail(email).map(User::getId).orElse(null);
    }

    @Scheduled(fixedRate = 60000) // Every minute
    public void checkScheduledAnnouncements() {
        LocalDateTime now = LocalDateTime.now();
        List<Announcement> toPublish = announcementRepo.findAll().stream()
                .filter(a -> a.getStatus() == AnnouncementStatus.SCHEDULED && a.getScheduledDate() != null && a.getScheduledDate().isBefore(now))
                .collect(Collectors.toList());

        for (Announcement a : toPublish) {
            a.setStatus(AnnouncementStatus.PUBLISHED);
            announcementRepo.save(a);
            notifyAllEmployees(a);
            n8nService.sendAnnouncementToN8n(a);
            System.out.println("Auto-published announcement: " + a.getTitle());
        }
    }
}
