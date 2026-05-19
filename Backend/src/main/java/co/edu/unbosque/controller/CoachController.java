package co.edu.unbosque.controller;

import co.edu.unbosque.dto.CoachRecomendacionResponse;
import co.edu.unbosque.service.CoachFinancieroService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachController {

    private final CoachFinancieroService coachService;

    /**
     * RF-11 — Recomendación 50/30/20 para un usuario.
     * @param idUsuario      ID del usuario
     * @param ingresoMensual (opcional) ingreso declarado; si no se envia,
     *                       se infiere desde las transacciones de tipo INGRESO/DEPOSITO.
     */
    @GetMapping("/recomendacion/{idUsuario}")
    public ResponseEntity<CoachRecomendacionResponse> recomendacion(
            @PathVariable Long idUsuario,
            @RequestParam(required = false) BigDecimal ingresoMensual) {
        return ResponseEntity.ok(coachService.recomendar(idUsuario, ingresoMensual));
    }

    /**
     * RQ-11 — Recomendación 50/30/20 calculada directamente por {@code fn_recomendar_ahorro} en MySQL.
     */
    @GetMapping("/recomendacion-bd/{idUsuario}")
    public ResponseEntity<String> recomendacionBD(
            @PathVariable Long idUsuario,
            @RequestParam(required = false) BigDecimal ingresoMensual) {
        return ResponseEntity.ok(coachService.recomendarConFuncionBD(idUsuario, ingresoMensual));
    }

    @GetMapping("/reglas")
    public ResponseEntity<List<String>> reglas() {
        return ResponseEntity.ok(coachService.reglasReferencia());
    }
}
