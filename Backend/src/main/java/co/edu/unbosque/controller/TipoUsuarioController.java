package co.edu.unbosque.controller;

import co.edu.unbosque.entity.TipoUsuario;
import co.edu.unbosque.request.TipoUsuarioRequest;
import co.edu.unbosque.service.TipoUsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-usuario")
@RequiredArgsConstructor
public class TipoUsuarioController {

    private final TipoUsuarioService tipoUsuarioService;

    @GetMapping
    public ResponseEntity<List<TipoUsuario>> getAll() {
        return ResponseEntity.ok(tipoUsuarioService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoUsuario> getById(@PathVariable Long id) {
        return tipoUsuarioService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TipoUsuario> create(@Valid @RequestBody TipoUsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tipoUsuarioService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tipoUsuarioService.delete(id);
        return ResponseEntity.noContent().build();
    }
}