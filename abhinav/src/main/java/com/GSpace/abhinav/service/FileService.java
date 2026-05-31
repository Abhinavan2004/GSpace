package com.GSpace.abhinav.service;

import com.GSpace.abhinav.dto.FileResponse;
import com.GSpace.abhinav.model.FileRecord;
import com.GSpace.abhinav.model.User;
import com.GSpace.abhinav.repository.FileRepository;
import com.GSpace.abhinav.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileService {

    @Value("${app.upload-dir}")
    private String uploadDir;

    private final FileRepository fileRepository;
    private final UserRepository userRepository;

    private Path getUploadPath() throws IOException {
        Path path = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(path);
        return path;
    }

    public FileResponse uploadFile(MultipartFile file, String username) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String originalName = file.getOriginalFilename();
        String storedName = UUID.randomUUID() + "_" + originalName;

        Path targetPath = getUploadPath().resolve(storedName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        FileRecord record = FileRecord.builder()
                .originalName(originalName)
                .storedName(storedName)
                .mimetype(file.getContentType())
                .size(file.getSize())
                .uploadedBy(user)
                .build();

        fileRepository.save(record);

        return new FileResponse(record.getId(), originalName, storedName,
                record.getMimetype(), record.getSize(), record.getCreatedAt());
    }

    public List<FileResponse> listFiles(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return fileRepository.findByUploadedByOrderByCreatedAtDesc(user)
                .stream()
                .map(f -> new FileResponse(f.getId(), f.getOriginalName(), f.getStoredName(),
                        f.getMimetype(), f.getSize(), f.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public Resource downloadFile(String storedName) throws MalformedURLException {
        Path filePath;
        try {
            filePath = getUploadPath().resolve(storedName).normalize();
        } catch (IOException e) {
            throw new RuntimeException("Could not resolve file path");
        }
        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists()) return resource;
        throw new RuntimeException("File not found: " + storedName);
    }

    public void deleteFile(Long id, String username) throws IOException {
        FileRecord record = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!record.getUploadedBy().getUsername().equals(username)) {
            throw new RuntimeException("Not authorized to delete this file");
        }

        Path filePath = getUploadPath().resolve(record.getStoredName()).normalize();
        Files.deleteIfExists(filePath);
        fileRepository.delete(record);
    }
}