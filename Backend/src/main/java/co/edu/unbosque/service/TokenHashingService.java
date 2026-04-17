package co.edu.unbosque.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class TokenHashingService {

    private final PasswordEncoder passwordEncoder;

    public String generateToken() {
        return UUID.randomUUID().toString();
    }

    public String hashToken(String token) {
        return passwordEncoder.encode(token);
    }

    public boolean validateToken(String presentedToken, String hashedToken) {
        return passwordEncoder.matches(presentedToken, hashedToken);
    }
}
