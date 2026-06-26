package com.hrplatform.controller;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path path = Paths.get(uploadDir).resolve(fileName);
            Files.write(path, file.getBytes());

            String fileUrl = "/files/download/" + fileName;
            return ResponseEntity.ok(Map.of(
                "url", fileUrl,
                "name", file.getOriginalFilename()
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download/{fileName}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String fileName, @RequestParam(required = false) boolean download) throws IOException {
        Path path = Paths.get(uploadDir).resolve(fileName);
        if (!Files.exists(path)) return ResponseEntity.notFound().build();

        byte[] data = Files.readAllBytes(path);
        
        String mimeType = Files.probeContentType(path);
        if (mimeType == null) mimeType = "application/octet-stream";

        String originalName = fileName.substring(fileName.indexOf("_") + 1);
        String disposition = download ? "attachment" : "inline";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, mimeType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + originalName + "\"")
                .body(data);
    }
}

