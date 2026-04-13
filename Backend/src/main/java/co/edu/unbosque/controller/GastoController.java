package co.edu.unbosque.controller;

import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.request.GastoRequest;
import co.edu.unbosque.service.GastoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}