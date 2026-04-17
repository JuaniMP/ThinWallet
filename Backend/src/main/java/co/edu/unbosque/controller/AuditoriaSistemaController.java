package co.edu.unbosque.controller;

import co.edu.unbosque.entity.AuditoriaSistema;
import co.edu.unbosque.request.AuditoriaSistemaRequest;
import co.edu.unbosque.service.AuditoriaSistemaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditoriaSistemaController {

    private final AuditoriaSistemaService auditoriaService;

    @GetMapping
    public ResponseEntity<List<AuditoriaSistema>> getAll() {
        return ResponseEntity.ok(auditoriaService.findAll());
    }

    @GetMapping("/{id}")
public ResponseEntity<AuditoriaSistema> getById(@PathVariable Long id) {
        return auditoriaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<AuditoriaSistema>> getByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(auditoriaService.findByUsuario(idUsuario));
    }

    @GetMapping("/tabla/{tabla}")
    public ResponseEntity<List<AuditoriaSistema>> getByTabla(@PathVariable String tabla) {
        return ResponseEntity.ok(auditoriaService.findByTablaAfectada(tabla));
    }

    @PostMapping
    public ResponseEntity<AuditoriaSistema> create(@Valid @RequestBody AuditoriaSistemaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditoriaService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        auditoriaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}