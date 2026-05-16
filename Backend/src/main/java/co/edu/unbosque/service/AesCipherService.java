package co.edu.unbosque.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * RNF-01 — Utilidad de cifrado simétrico AES-256-GCM.
 *
 * <p>Diseñado para cifrar campos sensibles de forma controlada por la
 * aplicación. <b>No</b> modifica entidades JPA: se inyecta donde se desee
 * cifrar/descifrar antes de persistir o después de leer.
 *
 * <p>La clave maestra se deriva con SHA-256 a partir de la propiedad
 * {@code thinwallet.cipher.master-key} (configurable en
 * {@code application.properties}). En entornos productivos debe sobreescribirse
 * con una variable de entorno.
 *
 * <p>Formato del payload cifrado: Base64( IV(12 bytes) || ciphertext+tag ).
 * Esto permite rotar la clave en el futuro sin parsear estructuras complejas.
 */
@Service
@Slf4j
public class AesCipherService {

    private static final String ALG = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    @Value("${thinwallet.cipher.master-key:thinwallet-default-change-me-in-production}")
    private String masterKey;

    private SecretKey secretKey;
    private final SecureRandom random = new SecureRandom();

    @PostConstruct
    void init() throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = sha.digest(masterKey.getBytes(StandardCharsets.UTF_8));
        this.secretKey = new SecretKeySpec(keyBytes, ALG);
        log.info("AesCipherService inicializado (AES-256-GCM).");
    }

    /**
     * Cifra el texto plano. Devuelve {@code null} si la entrada es {@code null}.
     */
    public String encrypt(String plain) {
        if (plain == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));

            byte[] payload = new byte[IV_LENGTH + ciphertext.length];
            System.arraycopy(iv, 0, payload, 0, IV_LENGTH);
            System.arraycopy(ciphertext, 0, payload, IV_LENGTH, ciphertext.length);
            return Base64.getEncoder().encodeToString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Error al cifrar valor", e);
        }
    }

    /**
     * Descifra el texto cifrado. Si la entrada no parece cifrada (decoding falla
     * o IV/tag no son válidos), devuelve la cadena original — útil para migrar
     * datos legacy sin romper consultas.
     */
    public String decrypt(String encoded) {
        if (encoded == null || encoded.isBlank()) return encoded;
        try {
            byte[] payload = Base64.getDecoder().decode(encoded);
            if (payload.length < IV_LENGTH + 16) return encoded;

            byte[] iv = new byte[IV_LENGTH];
            byte[] ciphertext = new byte[payload.length - IV_LENGTH];
            System.arraycopy(payload, 0, iv, 0, IV_LENGTH);
            System.arraycopy(payload, IV_LENGTH, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] plain = cipher.doFinal(ciphertext);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException badBase64) {
            return encoded;
        } catch (Exception e) {
            log.debug("decrypt() falló, devolviendo entrada legacy: {}", e.getMessage());
            return encoded;
        }
    }
}
