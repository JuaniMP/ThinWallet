package co.edu.unbosque.controller;

import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.request.LoginRequest;
import co.edu.unbosque.request.RegisterRequest;
import co.edu.unbosque.request.UsuarioRequest;
import co.edu.unbosque.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<Usuario>> getAll() {
        return ResponseEntity.ok(usuarioService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getById(@PathVariable Long id) {
        return usuarioService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/correo/{correo}")
    public ResponseEntity<Usuario> getByCorreo(@PathVariable String correo) {
        return usuarioService.findByCorreo(correo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (usuarioService.findByCorreo(request.getCorreo()).isPresent()) {
            return ResponseEntity.badRequest().body("El correo ya está registrado");
        }
        if (usuarioService.findByNombreUsuario(request.getNombreUsuario()).isPresent()) {
            return ResponseEntity.badRequest().body("El nombre de usuario ya está en uso");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return usuarioService.login(request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales inválidas"));
    }

    @PostMapping
    public ResponseEntity<Usuario> create(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> update(@PathVariable Long id, @Valid @RequestBody UsuarioRequest request) {
        return usuarioService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        usuarioService.delete(id);
        return ResponseEntity.noContent().build();
    }
}