package co.edu.unbosque.controller;

import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.request.LoginRequest;
import co.edu.unbosque.request.RegisterRequest;
import co.edu.unbosque.request.UsuarioRequest;
import co.edu.unbosque.request.RecuperarPasswordRequest;
import co.edu.unbosque.request.VerificarCodigoRequest;
import co.edu.unbosque.request.NuevaPasswordRequest;

import co.edu.unbosque.request.SaldoResponse;
import co.edu.unbosque.service.UsuarioService;
import co.edu.unbosque.service.SaldoService;
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
    private final SaldoService saldoService;

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

    @GetMapping("/{id}/saldo")
    public ResponseEntity<SaldoResponse> getSaldo(@PathVariable Long id) {
        return saldoService.calcularSaldo(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (usuarioService.findByCorreo(request.getCorreo()).isPresent()) {
            return ResponseEntity.badRequest().body("El correo ya esta registrado");
        }
        if (usuarioService.findByNombreUsuario(request.getNombreUsuario()).isPresent()) {
            return ResponseEntity.badRequest().body("El nombre de usuario ya esta en uso");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return usuarioService.login(request)
                .<ResponseEntity<?>>map(usuario -> {
                    if (usuario.getEstado() == 0) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Debe verificar su correo para iniciar sesion");
                    }
                    return ResponseEntity.ok(usuario);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales invalidas"));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@Valid @RequestBody VerificarCodigoRequest request) {
        boolean verificado = usuarioService.verifyRegistration(request.getCorreo(), request.getCodigo());
        if (verificado) {
            return ResponseEntity.ok("Cuenta verificada exitosamente. Ya puede iniciar sesion.");
        } else {
            return ResponseEntity.badRequest().body("Codigo de verificacion incorrecto o correo no encontrado");
        }
    }

    @PostMapping("/recuperar-contrasena")
    public ResponseEntity<?> solicitarRecuperacion(@Valid @RequestBody RecuperarPasswordRequest request) {
        try {
            usuarioService.solicitarRecuperacionPassword(request.getCorreo());
            return ResponseEntity.ok("Codigo de recuperacion enviado al correo");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verificar-codigo")
    public ResponseEntity<?> verificarCodigo(@Valid @RequestBody VerificarCodigoRequest request) {
        boolean esValido = usuarioService.validarCodigoRecuperacion(request.getCorreo(), request.getCodigo());
        if (esValido) {
            return ResponseEntity.ok("Codigo valido");
        } else {
            return ResponseEntity.badRequest().body("El codigo de recuperacion es incorrecto o ha expirado");
        }
    }

    @PostMapping("/cambiar-contrasena")
    public ResponseEntity<?> cambiarContrasena(@Valid @RequestBody NuevaPasswordRequest request) {
        try {
            usuarioService.cambiarContrasena(request.getCorreo(), request.getCodigo(), request.getNuevaContrasena());
            return ResponseEntity.ok("Contrasena actualizada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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
