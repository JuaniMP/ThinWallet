package co.edu.unbosque.controller;

import co.edu.unbosque.entity.TipoCirculo;
import co.edu.unbosque.request.TipoCirculoRequest;
import co.edu.unbosque.service.TipoCirculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-circulo")
@RequiredArgsConstructor
public class TipoCirculoController {

    private final TipoCirculoService tipoCirculoService;

    @GetMapping
    public ResponseEntity<List<TipoCirculo>> getAll() {
        return ResponseEntity.ok(tipoCirculoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoCirculo> getById(@PathVariable Long id) {
        return tipoCirculoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TipoCirculo> create(@Valid @RequestBody TipoCirculoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tipoCirculoService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tipoCirculoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}