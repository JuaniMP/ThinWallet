package co.edu.unbosque.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<?>> getByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/usuario/{idUsuario}/no-leidas-count")
    public ResponseEntity<Map<String, Long>> countNoLeidas(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(Map.of("count", 0L));
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<Void> marcarLeida(@PathVariable Long id) {
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/usuario/{idUsuario}/leer-todas")
    public ResponseEntity<Void> marcarTodasLeidas(@PathVariable Long idUsuario) {
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return ResponseEntity.noContent().build();
    }
}
