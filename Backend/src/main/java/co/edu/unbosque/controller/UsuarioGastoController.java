package co.edu.unbosque.controller;

import co.edu.unbosque.entity.UsuarioGasto;
import co.edu.unbosque.request.UsuarioGastoRequest;
import co.edu.unbosque.service.UsuarioGastoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios-gastos")
@RequiredArgsConstructor
public class UsuarioGastoController {

    private final UsuarioGastoService usuarioGastoService;

    @GetMapping
    public ResponseEntity<List<UsuarioGasto>> getAll() {
        return ResponseEntity.ok(usuarioGastoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioGasto> getById(@PathVariable Long id) {
        return usuarioGastoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<UsuarioGasto>> getByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(usuarioGastoService.findByUsuario(idUsuario));
    }

    @GetMapping("/gasto/{idGasto}")
    public ResponseEntity<List<UsuarioGasto>> getByGasto(@PathVariable Long idGasto) {
        return ResponseEntity.ok(usuarioGastoService.findByGasto(idGasto));
    }

    @PostMapping
    public ResponseEntity<UsuarioGasto> create(@Valid @RequestBody UsuarioGastoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioGastoService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        usuarioGastoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}