package co.edu.unbosque.service;

import co.edu.unbosque.entity.Notificacion;
import co.edu.unbosque.repository.NotificacionJpaRepository;
import co.edu.unbosque.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionJpaRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Autowired(required = false)
    private FcmService fcmService;

    @Transactional
    public Notificacion crear(Long idUsuarioDestino, String titulo, String mensaje,
                               String tipo, Long idCirculoGasto, String nombreCirculo) {
        Notificacion n = new Notificacion();
        n.setIdUsuarioDestino(idUsuarioDestino);
        n.setTitulo(titulo);
        n.setMensaje(mensaje);
        n.setTipo(tipo);
        n.setIdCirculoGasto(idCirculoGasto);
        n.setNombreCirculo(nombreCirculo);
        n.setLeida(false);
        n.setFechaCreacion(LocalDateTime.now());
        Notificacion saved = notificacionRepository.save(n);
        log.info("Notificacion creada para usuario {}: {}", idUsuarioDestino, titulo);

        if (fcmService != null) {
            usuarioRepository.findById(idUsuarioDestino).ifPresent(u -> {
                if (u.getFcmToken() != null && !u.getFcmToken().isBlank()) {
                    fcmService.enviarNotificacion(u.getFcmToken(), titulo, mensaje);
                }
            });
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Notificacion> findByUsuario(Long idUsuarioDestino) {
        return notificacionRepository.findByIdUsuarioDestinoOrderByFechaCreacionDesc(idUsuarioDestino);
    }

    @Transactional(readOnly = true)
    public long countNoLeidas(Long idUsuarioDestino) {
        return notificacionRepository.countByIdUsuarioDestinoAndLeidaFalse(idUsuarioDestino);
    }

    @Transactional
    public Optional<Notificacion> marcarLeida(Long id) {
        return notificacionRepository.findById(id).map(n -> {
            n.setLeida(true);
            return notificacionRepository.save(n);
        });
    }

    @Transactional
    public void marcarTodasLeidas(Long idUsuarioDestino) {
        notificacionRepository.marcarTodasLeidasByUsuario(idUsuarioDestino);
    }

    @Transactional
    public void delete(Long id) {
        notificacionRepository.deleteById(id);
    }
}
