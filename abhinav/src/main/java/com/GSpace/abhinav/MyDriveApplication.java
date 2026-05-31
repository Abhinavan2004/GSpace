package com.GSpace.abhinav;

import com.GSpace.abhinav.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MyDriveApplication {

	public static void main(String[] args) {
		SpringApplication.run(MyDriveApplication.class, args);
	}

	// Creates admin user on first startup automatically
	@Bean
	CommandLineRunner init(AuthService authService) {
		return args -> {
			authService.createUserIfNotExists("admin", "abcd1234");
		};
	}
}