package co.edu.unbosque.controller;

import co.edu.unbosque.entity.Deuda;
import co.edu.unbosque.request.DeudaRequest;
import co.edu.unbosque.service.DeudaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deudas")
@RequiredArgsConstructor
public class DeudaController {

    private final DeudaService deudaService;

    @GetMapping
    public ResponseEntity<List<Deuda>> getAll() {
        return ResponseEntity.ok(deudaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Deuda> getById(@PathVariable Long id) {
        return deudaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/deudor/{idUsuario}")
    public ResponseEntity<List<Deuda>> getByDeudor(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(deudaService.findByUsuarioDeudor(idUsuario));
    }

    @GetMapping("/acreedor/{idUsuario}")
    public ResponseEntity<List<Deuda>> getByAcreedor(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(deudaService.findByUsuarioAcreedor(idUsuario));
    }

    @PostMapping
    public ResponseEntity<Deuda> create(@Valid @RequestBody DeudaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deudaService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Deuda> update(@PathVariable Long id, @Valid @RequestBody DeudaRequest request) {
        return deudaService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/confirmar")
    public ResponseEntity<Deuda> confirmarPago(@PathVariable Long id) {
        return deudaService.confirmarPago(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deudaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}