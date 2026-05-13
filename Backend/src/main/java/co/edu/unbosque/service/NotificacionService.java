package co.edu.unbosque.service;

import co.edu.unbosque.document.Notificacion;
import co.edu.unbosque.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "mongodb.enabled", havingValue = "true")
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

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
        return saved;
    }

    public List<Notificacion> findByUsuario(Long idUsuarioDestino) {
        return notificacionRepository.findByIdUsuarioDestinoOrderByFechaCreacionDesc(idUsuarioDestino);
    }

    public long countNoLeidas(Long idUsuarioDestino) {
        return notificacionRepository.countByIdUsuarioDestinoAndLeidaFalse(idUsuarioDestino);
    }

    public Optional<Notificacion> marcarLeida(String id) {
        return notificacionRepository.findById(id).map(n -> {
            n.setLeida(true);
            return notificacionRepository.save(n);
        });
    }

    public void marcarTodasLeidas(Long idUsuarioDestino) {
        List<Notificacion> pendientes = notificacionRepository
                .findByIdUsuarioDestinoOrderByFechaCreacionDesc(idUsuarioDestino);
        pendientes.stream().filter(n -> !n.isLeida()).forEach(n -> {
            n.setLeida(true);
            notificacionRepository.save(n);
        });
    }

    public void delete(String id) {
        notificacionRepository.deleteById(id);
    }
}
