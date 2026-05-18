package co.edu.unbosque.controller;

import co.edu.unbosque.entity.Notificacion;
import co.edu.unbosque.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Notificacion>> getByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(notificacionService.findByUsuario(idUsuario));
    }

    @GetMapping("/usuario/{idUsuario}/no-leidas-count")
    public ResponseEntity<Map<String, Long>> countNoLeidas(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(Map.of("count", notificacionService.countNoLeidas(idUsuario)));
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<?> marcarLeida(@PathVariable Long id) {
        return notificacionService.marcarLeida(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/usuario/{idUsuario}/leer-todas")
    public ResponseEntity<Void> marcarTodasLeidas(@PathVariable Long idUsuario) {
        notificacionService.marcarTodasLeidas(idUsuario);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notificacionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
