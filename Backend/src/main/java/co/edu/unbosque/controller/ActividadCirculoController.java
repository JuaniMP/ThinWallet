package co.edu.unbosque.controller;

import co.edu.unbosque.document.ActividadCirculoDiaria;
import co.edu.unbosque.document.IndicadoresCirculo;
import co.edu.unbosque.service.ActividadCirculoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Dashboard de actividad del círculo (MongoDB).
 * Consumidor: líder del círculo.
 */
@RestController
@RequestMapping("/api/actividad-circulo")
@RequiredArgsConstructor
public class ActividadCirculoController {

    private final ActividadCirculoService actividadCirculoService;

    /** Indicadores generales del círculo (salud, fricción, nivel actividad) */
    @GetMapping("/{idCirculo}/indicadores")
    public ResponseEntity<IndicadoresCirculo> getIndicadores(@PathVariable Long idCirculo) {
        return actividadCirculoService.getIndicadores(idCirculo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Actividad de hoy (buckets del día actual) */
    @GetMapping("/{idCirculo}/hoy")
    public ResponseEntity<List<ActividadCirculoDiaria>> getActividadHoy(@PathVariable Long idCirculo) {
        return ResponseEntity.ok(actividadCirculoService.getActividadHoy(idCirculo));
    }

    /**
     * Tipos de eventos más frecuentes.
     * Parámetro opcional: dias (default 7)
     */
    @GetMapping("/{idCirculo}/eventos-frecuentes")
    public ResponseEntity<List<Map<String, Object>>> getEventosFrecuentes(
            @PathVariable Long idCirculo,
            @RequestParam(defaultValue = "7") int dias) {
        return ResponseEntity.ok(actividadCirculoService.getEventosFrecuentes(idCirculo, dias));
    }

    /**
     * Miembro más activo.
     * Parámetro opcional: dias (default 30)
     */
    @GetMapping("/{idCirculo}/miembro-activo")
    public ResponseEntity<Map<String, Object>> getMiembroMasActivo(
            @PathVariable Long idCirculo,
            @RequestParam(defaultValue = "30") int dias) {
        return ResponseEntity.ok(actividadCirculoService.getMiembroMasActivo(idCirculo, dias));
    }

    /**
     * Evolución de transacciones por día.
     * Parámetro opcional: dias (default 7)
     */
    @GetMapping("/{idCirculo}/evolucion")
    public ResponseEntity<List<Map<String, Object>>> getEvolucion(
            @PathVariable Long idCirculo,
            @RequestParam(defaultValue = "7") int dias) {
        return ResponseEntity.ok(actividadCirculoService.getEvolucionTransacciones(idCirculo, dias));
    }

    /**
     * Registro manual de evento (útil para pruebas o integraciones externas).
     * Body: { "tipoEvento": "...", "idUsuario": 1, "contexto": {...} }
     */
    @PostMapping("/{idCirculo}/evento")
    public ResponseEntity<Void> registrarEvento(
            @PathVariable Long idCirculo,
            @RequestBody Map<String, Object> body) {

        String tipoEvento = (String) body.get("tipoEvento");
        Long idUsuario = body.get("idUsuario") instanceof Number
                ? ((Number) body.get("idUsuario")).longValue() : null;

        @SuppressWarnings("unchecked")
        Map<String, Object> contexto = body.containsKey("contexto")
                ? (Map<String, Object>) body.get("contexto") : Map.of();

        if (tipoEvento == null || tipoEvento.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        actividadCirculoService.registrarEvento(idCirculo, tipoEvento, idUsuario, contexto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
