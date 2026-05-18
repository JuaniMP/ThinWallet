package co.edu.unbosque.controller;

import co.edu.unbosque.dto.LoginResponse;
import co.edu.unbosque.dto.UsuarioBusquedaResponse;
import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.entity.CirculoGasto;
import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.request.LoginRequest;
import co.edu.unbosque.request.RegisterRequest;
import co.edu.unbosque.request.UsuarioRequest;
import co.edu.unbosque.request.RecuperarPasswordRequest;
import co.edu.unbosque.request.VerificarCodigoRequest;
import co.edu.unbosque.request.NuevaPasswordRequest;
import co.edu.unbosque.request.UsuarioCirculoRequest;

import co.edu.unbosque.request.SaldoResponse;
import co.edu.unbosque.service.JwtService;
import co.edu.unbosque.service.UsuarioService;
import co.edu.unbosque.service.SaldoService;
import co.edu.unbosque.service.CirculoGastoService;
import co.edu.unbosque.service.UsuarioCirculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Slf4j
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final SaldoService saldoService;
    private final CirculoGastoService circuloGastoService;
    private final UsuarioCirculoService usuarioCirculoService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

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

    @GetMapping("/buscar")
    public ResponseEntity<List<UsuarioBusquedaResponse>> buscar(
            @RequestParam(defaultValue = "")
            @jakarta.validation.constraints.Size(max = 100)
            @jakarta.validation.constraints.Pattern(regexp = "^[\\w\\s@.áéíóúÁÉÍÓÚñÑ_-]*$", message = "Caracteres no permitidos en la búsqueda")
            String q,
            @RequestParam(required = false) Long excludeId) {
        return ResponseEntity.ok(usuarioService.buscarUsuariosRegistrados(q, excludeId));
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
                    String token = jwtService.generateToken(usuario.getIdUsuario(), usuario.getCorreo());
                    return ResponseEntity.ok(new LoginResponse(token, usuario));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales invalidas"));
    }

    @PostMapping("/login-token")
    public ResponseEntity<?> loginWithToken(@RequestBody Map<String, String> request) {
        String tokenInvitacion = request.get("tokenInvitacion");
        log.info("Intento de login con token: {}", tokenInvitacion);
        if (tokenInvitacion == null || tokenInvitacion.isEmpty()) {
            return ResponseEntity.badRequest().body("Token requerido");
        }

        // Intento 1: ¿Es un token personal de un usuario invitado (tokenReclamo)?
        Optional<Usuario> usuarioOpt = usuarioService.loginWithToken(tokenInvitacion);
        if (usuarioOpt.isPresent()) {
            Usuario u = usuarioOpt.get();
            log.info("Token personal valido para usuario: {}", u.getCorreo());
            String token = jwtService.generateToken(u.getIdUsuario(), u.getCorreo());
            return ResponseEntity.ok(new LoginResponse(token, u));
        }

        // Intento 2: ¿Es el token de un Círculo de Gasto?
        Optional<CirculoGasto> circuloOpt = circuloGastoService.findByTokenInvitacion(tokenInvitacion);
        if (circuloOpt.isPresent()) {
            CirculoGasto circulo = circuloOpt.get();
            log.info("Token de circulo detectado para el circulo: {}", circulo.getNombre());

            // Si no hay invitados pendientes, creamos un nuevo invitado al vuelo
            String sufijo = UUID.randomUUID().toString().substring(0, 6);

            UsuarioRequest nuevoReq = new UsuarioRequest();
            nuevoReq.setNombres("Invitado");
            nuevoReq.setApellidos(circulo.getNombre() + " " + sufijo);
            nuevoReq.setNombreUsuario("guest_" + sufijo);
            nuevoReq.setCorreo("guest_" + sufijo + "@thinwallet.local");
            nuevoReq.setContrasenaHash(sufijo); // Se hasheará en create
            nuevoReq.setTipoUsuario("3"); // Invitado
            nuevoReq.setDescripcion("Usuario generado por token de círculo");

            Usuario nuevoInvitado = usuarioService.create(nuevoReq);

            UsuarioCirculoRequest ucReq = new UsuarioCirculoRequest();
            ucReq.setIdUsuario(nuevoInvitado.getIdUsuario());
            ucReq.setIdCirculoGasto(circulo.getIdCirculoGasto());
            ucReq.setRolUsuario("INVITADO");
            usuarioCirculoService.create(ucReq);

            log.info("Nuevo invitado {} creado al vuelo por token de círculo", nuevoInvitado.getCorreo());
            String token = jwtService.generateToken(nuevoInvitado.getIdUsuario(), nuevoInvitado.getCorreo());
            return ResponseEntity.ok(new LoginResponse(token, nuevoInvitado));
        }

        log.warn("Token invalido: {}", tokenInvitacion);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token inválido o expirado");
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

    @PostMapping("/reenviar-verificacion")
    public ResponseEntity<?> reenviarVerificacion(@RequestBody RecuperarPasswordRequest request) {
        try {
            usuarioService.reenviarVerificacion(request.getCorreo());
            return ResponseEntity.ok("Codigo de verificacion reenviado al correo");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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

    @PatchMapping("/{id}/perfil")
    public ResponseEntity<?> updatePerfil(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return usuarioService.updatePerfil(
                id,
                body.get("nombres"),
                body.get("apellidos"),
                body.get("nombreUsuario"),
                body.get("descripcion"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/cambiar-contrasena")
    public ResponseEntity<?> cambiarContrasenaAutenticado(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            usuarioService.cambiarContrasenaAutenticado(id, body.get("contrasenaActual"), body.get("nuevaContrasena"));
            return ResponseEntity.ok("Contraseña actualizada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Reclamación de perfil: convierte cuenta fantasma en cuenta real.
     * Body: { tokenReclamo, nombres, apellidos, nombreUsuario, correo, contrasena }
     */
    @PostMapping("/reclamar-perfil")
    public ResponseEntity<?> reclamarPerfil(@RequestBody Map<String, String> body) {
        try {
            Usuario usuario = usuarioService.reclamarPerfil(
                    body.get("tokenReclamo"),
                    body.get("nombres"),
                    body.get("apellidos"),
                    body.get("nombreUsuario"),
                    body.get("correo"),
                    body.get("contrasena")
            );
            return ResponseEntity.ok(usuario);
        } catch (RuntimeException e) {
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

    @PutMapping("/{id}/fcm-token")
    public ResponseEntity<Void> registrarFcmToken(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body) {
        String fcmToken = body.get("fcmToken");
        if (fcmToken == null || fcmToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        usuarioService.actualizarFcmToken(id, fcmToken);
        return ResponseEntity.noContent().build();
    }
}
