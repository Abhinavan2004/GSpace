package com.GSpace.abhinav.service;

import com.GSpace.abhinav.dto.LoginRequest;
import com.GSpace.abhinav.dto.LoginResponse;
import com.GSpace.abhinav.model.User;
import com.GSpace.abhinav.repository.UserRepository;
import com.GSpace.abhinav.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword())
        );
        String token = jwtUtil.generateToken(request.getUsername());
        return new LoginResponse(token, request.getUsername());
    }

    public void createUserIfNotExists(String username, String password) {
        // Validate username
        if (username == null || username.trim().length() < 3) {
            throw new RuntimeException("Username must be at least 3 characters.");
        }
        // Validate password
        if (password == null || password.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }
        // Check if username already taken
        if (userRepository.existsByUsername(username.trim())) {
            throw new RuntimeException("Username already taken. Please choose another.");
        }

        User user = User.builder()
                .username(username.trim())
                .password(passwordEncoder.encode(password))
                .build();
        userRepository.save(user);
        System.out.println("✅ New user created: " + username);
    }
}