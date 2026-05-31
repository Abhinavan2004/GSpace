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

    // Call this once to create your admin user
    public void createUserIfNotExists(String username, String password) {
        if (!userRepository.existsByUsername(username)) {
            User user = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .build();
            userRepository.save(user);
            System.out.println("✅ Admin user created: " + username);
        }
    }
}