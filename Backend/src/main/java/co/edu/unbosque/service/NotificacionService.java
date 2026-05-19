package co.edu.unbosque.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificacionService {

    private final FcmTokenStore fcmTokenStore;

    @Autowired(required = false)
    private FcmService fcmService;

    public void crear(Long idUsuarioDestino, String titulo, String mensaje,
                      String tipo, Long idCirculoGasto, String nombreCirculo) {
        if (fcmService == null) return;
        String token = fcmTokenStore.obtener(idUsuarioDestino);
        if (token != null) {
            fcmService.enviarNotificacion(token, titulo, mensaje);
            log.info("Push FCM enviado a usuario {}: {}", idUsuarioDestino, titulo);
        }
    }
}
