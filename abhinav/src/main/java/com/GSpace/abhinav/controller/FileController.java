package com.GSpace.abhinav.controller;

import com.GSpace.abhinav.dto.FileResponse;
import com.GSpace.abhinav.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    // Upload
    @PostMapping("/upload")
    public ResponseEntity<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        return ResponseEntity.ok(fileService.uploadFile(file, userDetails.getUsername()));
    }

    // List all files for logged-in user
    @GetMapping
    public ResponseEntity<List<FileResponse>> listFiles(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(fileService.listFiles(userDetails.getUsername()));
    }

    // Download
    @GetMapping("/download/{storedName}")
    public ResponseEntity<Resource> download(@PathVariable String storedName) throws IOException {
        Resource resource = fileService.downloadFile(storedName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    // Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        fileService.deleteFile(id, userDetails.getUsername());
        return ResponseEntity.ok("File deleted");
    }
}