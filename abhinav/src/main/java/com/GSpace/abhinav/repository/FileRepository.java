package com.GSpace.abhinav.repository;

import com.GSpace.abhinav.model.FileRecord;
import com.GSpace.abhinav.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FileRepository extends JpaRepository<FileRecord, Long> {
    List<FileRecord> findByUploadedByOrderByCreatedAtDesc(User user);
    Optional<FileRecord> findByStoredName(String storedName);
}