package co.edu.unbosque.service;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Almacén en memoria de tokens FCM por usuario.
 * Los tokens se restauran automáticamente cuando el usuario inicia sesión.
 */
@Component
public class FcmTokenStore {

    private final ConcurrentHashMap<Long, String> tokens = new ConcurrentHashMap<>();

    public void guardar(Long idUsuario, String fcmToken) {
        if (fcmToken != null && !fcmToken.isBlank()) {
            tokens.put(idUsuario, fcmToken);
        }
    }

    public String obtener(Long idUsuario) {
        return tokens.get(idUsuario);
    }

    public void eliminar(Long idUsuario) {
        tokens.remove(idUsuario);
    }
}
