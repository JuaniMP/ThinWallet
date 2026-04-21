package co.edu.unbosque.controller;

import co.edu.unbosque.entity.TipoMovimiento;
import co.edu.unbosque.request.TipoMovimientoRequest;
import co.edu.unbosque.service.TipoMovimientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-movimiento")
@RequiredArgsConstructor
public class TipoMovimientoController {

    private final TipoMovimientoService tipoMovimientoService;

    @GetMapping
    public ResponseEntity<List<TipoMovimiento>> getAll() {
        return ResponseEntity.ok(tipoMovimientoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoMovimiento> getById(@PathVariable Long id) {
        return tipoMovimientoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TipoMovimiento> create(@Valid @RequestBody TipoMovimientoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tipoMovimientoService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tipoMovimientoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}