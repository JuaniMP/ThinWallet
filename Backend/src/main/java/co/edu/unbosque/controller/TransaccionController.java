package co.edu.unbosque.controller;

import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.request.TransaccionRequest;
import co.edu.unbosque.service.TransaccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transacciones")
@RequiredArgsConstructor
public class TransaccionController {

    private final TransaccionService transaccionService;

    @GetMapping
    public ResponseEntity<List<Transaccion>> getAll() {
        return ResponseEntity.ok(transaccionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaccion> getById(@PathVariable Long id) {
        return transaccionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Transaccion>> getByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(transaccionService.findByUsuario(idUsuario));
    }

    @PostMapping
    public ResponseEntity<Transaccion> create(@Valid @RequestBody TransaccionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transaccionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaccion> update(@PathVariable Long id, @Valid @RequestBody TransaccionRequest request) {
        return transaccionService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transaccionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}