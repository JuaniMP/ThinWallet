package co.edu.unbosque.controller;

import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.request.GastoRequest;
import co.edu.unbosque.service.GastoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/gastos")
@RequiredArgsConstructor
public class GastoController {

    private final GastoService gastoService;

    @GetMapping
    public ResponseEntity<List<Gasto>> getAll() {
        return ResponseEntity.ok(gastoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Gasto> getById(@PathVariable Long id) {
        return gastoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/creador/{idUsuarioCreador}")
    public ResponseEntity<List<Gasto>> getByUsuarioCreador(@PathVariable Long idUsuarioCreador) {
        return ResponseEntity.ok(gastoService.findByUsuarioCreador(idUsuarioCreador));
    }

    @GetMapping("/circulo/{idCirculoGasto}")
    public ResponseEntity<List<Gasto>> getByCirculo(@PathVariable Long idCirculoGasto) {
        return ResponseEntity.ok(gastoService.findByCirculoGasto(idCirculoGasto));
    }

    /** Gastos programados (periodicidad != META) del usuario */
    @GetMapping("/programados/usuario/{idUsuario}")
    public ResponseEntity<List<Gasto>> getProgramadosByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(gastoService.findProgramadosByUsuario(idUsuario));
    }

    /** Metas de ahorro del usuario */
    @GetMapping("/metas/usuario/{idUsuario}")
    public ResponseEntity<List<Gasto>> getMetasByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(gastoService.findMetasByUsuario(idUsuario));
    }

    @PostMapping
    public ResponseEntity<Gasto> create(@Valid @RequestBody GastoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gastoService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Gasto> update(@PathVariable Long id, @Valid @RequestBody GastoRequest request) {
        return gastoService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gastoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Metas grupales ────────────────────────────────────────────────────────

    @GetMapping("/circulo/{idCirculo}/metas-grupales")
    public ResponseEntity<List<Gasto>> getMetasGrupales(@PathVariable Long idCirculo) {
        return ResponseEntity.ok(gastoService.findMetasGrupalesByCirculo(idCirculo));
    }

    @PostMapping("/circulo/{idCirculo}/meta-grupal")
    public ResponseEntity<Gasto> proponerMeta(
            @PathVariable Long idCirculo,
            @RequestParam Long idUsuario,
            @Valid @RequestBody GastoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gastoService.proponerMetaGrupal(idCirculo, idUsuario, request));
    }

    @PutMapping("/{idGasto}/meta-grupal/aceptar")
    public ResponseEntity<Gasto> aceptarMeta(
            @PathVariable Long idGasto,
            @RequestParam Long idUsuario) {
        return ResponseEntity.ok(gastoService.aceptarMetaGrupal(idGasto, idUsuario));
    }

    @PutMapping("/{idGasto}/meta-grupal/rechazar")
    public ResponseEntity<Void> rechazarMeta(
            @PathVariable Long idGasto,
            @RequestParam Long idUsuario) {
        gastoService.rechazarMetaGrupal(idGasto, idUsuario);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{idGasto}/meta-grupal/abonar")
    public ResponseEntity<Gasto> abonarMeta(
            @PathVariable Long idGasto,
            @RequestParam Long idUsuario,
            @RequestParam BigDecimal monto) {
        return ResponseEntity.ok(gastoService.abonarMetaGrupal(idGasto, idUsuario, monto));
    }
}