package co.edu.unbosque.controller;

import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.request.UsuarioCirculoRequest;
import co.edu.unbosque.service.UsuarioCirculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios-circulos")
@RequiredArgsConstructor
public class UsuarioCirculoController {

    private final UsuarioCirculoService usuarioCirculoService;

    @GetMapping
    public ResponseEntity<List<UsuarioCirculo>> getAll() {
        return ResponseEntity.ok(usuarioCirculoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioCirculo> getById(@PathVariable Long id) {
        return usuarioCirculoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<UsuarioCirculo>> getByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(usuarioCirculoService.findByUsuario(idUsuario));
    }

    @GetMapping("/circulo/{idCirculoGasto}")
    public ResponseEntity<List<UsuarioCirculo>> getByCirculoGasto(@PathVariable Long idCirculoGasto) {
        return ResponseEntity.ok(usuarioCirculoService.findByCirculoGasto(idCirculoGasto));
    }

    @PostMapping
    public ResponseEntity<UsuarioCirculo> create(@Valid @RequestBody UsuarioCirculoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioCirculoService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioCirculo> update(@PathVariable Long id, @Valid @RequestBody UsuarioCirculoRequest request) {
        return usuarioCirculoService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        usuarioCirculoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}