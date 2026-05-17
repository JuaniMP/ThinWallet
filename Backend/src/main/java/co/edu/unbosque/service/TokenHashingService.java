package co.edu.unbosque.service;

import co.edu.unbosque.dto.TokenPair;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Servicio para manejar la generación y validación de tokens hasheados.
 * Los tokens se generan como UUID y se guardan hasheados en BD.
 * Esto evita que si alguien accede a la BD, pueda usar los tokens directamente.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TokenHashingService {

    private final PasswordEncoder passwordEncoder;

    /**
     * Genera un token único (UUID) sin hashear
     * El token hasheado se genera en un paso separado
     */
    public String generateToken() {
        return UUID.randomUUID().toString();
    }

    /**
     * Hashea un token usando BCrypt
     * @param token Token en texto plano (UUID)
     * @return Token hasheado listo para guardar en BD
     */
    public String hashToken(String token) {
        String hashedToken = passwordEncoder.encode(token);
        log.debug("Token generado y hasheado exitosamente");
        return hashedToken;
    }

    /**
     * Valida que un token presentado coincida con el token hasheado almacenado
     * @param presentedToken Token presentado por el usuario (UUID sin hashear)
     * @param hashedToken Token almacenado en BD (hasheado)
     * @return true si coinciden, false si no
     */
    public boolean validateToken(String presentedToken, String hashedToken) {
        return passwordEncoder.matches(presentedToken, hashedToken);
    }

    /**
     * Genera un token en su forma original y hasheada
     * @return TokenPair con token original (para usuario) y hasheado (para BD)
     */
    public TokenPair generateTokenPair() {
        String original = generateToken();
        String hashed = hashToken(original);
        log.info("TokenPair generado: original para usuario, hasheado para BD");
        return new TokenPair(original, hashed);
    }
}
