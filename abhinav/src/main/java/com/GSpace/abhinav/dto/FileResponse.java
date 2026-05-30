package com.GSpace.abhinav.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class FileResponse {
    private Long id;
    private String originalName;
    private String storedName;
    private String mimetype;
    private Long size;
    private LocalDateTime createdAt;
}