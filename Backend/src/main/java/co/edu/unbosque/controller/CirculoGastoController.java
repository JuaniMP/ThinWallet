package co.edu.unbosque.controller;

import co.edu.unbosque.entity.CirculoGasto;
import co.edu.unbosque.request.CirculoGastoRequest;
import co.edu.unbosque.service.CirculoGastoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/circulos-gasto")
@RequiredArgsConstructor
public class CirculoGastoController {

    private final CirculoGastoService circuloGastoService;

    @GetMapping
    public ResponseEntity<List<CirculoGasto>> getAll() {
        return ResponseEntity.ok(circuloGastoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CirculoGasto> getById(@PathVariable Long id) {
        return circuloGastoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/invitacion/{token}")
    public ResponseEntity<CirculoGasto> getByToken(@PathVariable String token) {
        return circuloGastoService.findByTokenInvitacion(token)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CirculoGasto> create(@Valid @RequestBody CirculoGastoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(circuloGastoService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CirculoGasto> update(@PathVariable Long id, @Valid @RequestBody CirculoGastoRequest request) {
        return circuloGastoService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        circuloGastoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}