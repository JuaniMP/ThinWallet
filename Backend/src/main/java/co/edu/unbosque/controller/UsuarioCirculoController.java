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

    @GetMapping("/{idUsuario}/{idCirculoGasto}")
    public ResponseEntity<UsuarioCirculo> getById(@PathVariable Long idUsuario, @PathVariable Long idCirculoGasto) {
        return usuarioCirculoService.findById(idUsuario, idCirculoGasto)
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

    @PutMapping("/{idUsuario}/{idCirculoGasto}")
    public ResponseEntity<UsuarioCirculo> update(@PathVariable Long idUsuario, @PathVariable Long idCirculoGasto, @Valid @RequestBody UsuarioCirculoRequest request) {
        return usuarioCirculoService.update(idUsuario, idCirculoGasto, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{idUsuario}/{idCirculoGasto}")
    public ResponseEntity<Void> delete(@PathVariable Long idUsuario, @PathVariable Long idCirculoGasto) {
        usuarioCirculoService.delete(idUsuario, idCirculoGasto);
        return ResponseEntity.noContent().build();
    }
}