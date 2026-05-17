package co.edu.unbosque.service;

import co.edu.unbosque.dto.UsuarioBusquedaResponse;
import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.entity.TipoUsuario;
import co.edu.unbosque.repository.UsuarioRepository;
import co.edu.unbosque.repository.TipoUsuarioRepository;
import co.edu.unbosque.request.LoginRequest;
import co.edu.unbosque.request.RegisterRequest;
import co.edu.unbosque.request.UsuarioRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final TipoUsuarioRepository tipoUsuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final TokenHashingService tokenHashingService;

    @Autowired(required = false)
    private AuditoriaSistemaService auditoriaService;

    private final Map<String, String> resetTokens = new ConcurrentHashMap<>();
    private final Map<String, String> registrationTokens = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public List<Usuario> findAll() {
        return usuarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> findById(Long id) {
        return usuarioRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> findByCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo);
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> findByNombreUsuario(String nombreUsuario) {
        return usuarioRepository.findByNombreUsuario(nombreUsuario);
    }

    @Transactional
    public Optional<Usuario> login(LoginRequest request) {
        Optional<Usuario> resultado = usuarioRepository.findByCorreo(request.getCorreo())
                .filter(usuario -> passwordEncoder.matches(request.getContrasena(), usuario.getContrasenaHash()));
        resultado.ifPresent(usuario -> {
            if (auditoriaService != null) {
                auditoriaService.registrar(usuario.getIdUsuario(), "usuario", usuario.getIdUsuario(),
                        "LOGIN", null, "{\"correo\":\"" + usuario.getCorreo() + "\"}");
            }
        });
        return resultado;
    }

    public void reenviarVerificacion(String correo) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(correo);
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("No existe un usuario con ese correo electrónico");
        }
        Usuario usuario = usuarioOpt.get();
        if (usuario.getEstado() == 1) {
            throw new RuntimeException("El usuario ya está verificado");
        }
        String codigo = String.format("%06d", new Random().nextInt(999999));
        registrationTokens.put(correo, codigo);
        emailService.enviarCodigoVerificacion(correo, codigo);
        log.info("Codigo de verificacion reenviado para {}: {}", correo, codigo);
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> loginWithToken(String tokenReclamo) {
        return usuarioRepository.findAll().stream()
                .filter(u -> tokenReclamo.equals(u.getTokenReclamo()))
                .findFirst();
    }

    public void solicitarRecuperacionPassword(String correo) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(correo);
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("No existe un usuario con ese correo electrónico");
        }
        String codigo = String.format("%06d", new Random().nextInt(999999));
        resetTokens.put(correo, codigo);
        emailService.enviarCodigoRecuperacion(correo, codigo);
        log.info("Codigo de recuperacion generado para {}: {}", correo, codigo);
    }

    public boolean validarCodigoRecuperacion(String correo, String codigo) {
        String codigoGuardado = resetTokens.get(correo);
        return codigoGuardado != null && codigoGuardado.equals(codigo);
    }

    @Transactional
    public void cambiarContrasena(String correo, String codigo, String nuevaContrasena) {
        if (!validarCodigoRecuperacion(correo, codigo)) {
            throw new RuntimeException("El codigo de recuperacion es incorrecto o ha expirado");
        }
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("No existe un usuario con ese correo electrónico"));
        usuario.setContrasenaHash(passwordEncoder.encode(nuevaContrasena));
        usuarioRepository.save(usuario);

        if (auditoriaService != null) {
            auditoriaService.registrar(usuario.getIdUsuario(), "usuario", usuario.getIdUsuario(),
                    "CAMBIO_CONTRASENA", null, "{\"correo\":\"" + correo + "\"}");
        }

        resetTokens.remove(correo);
    }

    @Transactional
    public void cambiarContrasenaAutenticado(Long idUsuario, String contrasenaActual, String nuevaContrasena) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (!passwordEncoder.matches(contrasenaActual, usuario.getContrasenaHash())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }
        usuario.setContrasenaHash(passwordEncoder.encode(nuevaContrasena));
        usuarioRepository.save(usuario);
        if (auditoriaService != null) {
            auditoriaService.registrar(idUsuario, "usuario", idUsuario,
                    "CAMBIO_PASS_AUTH", null, null);
        }
    }

    @Transactional
    public Usuario register(RegisterRequest request) {
        Usuario usuario = new Usuario();
        usuario.setNombres(request.getNombres());
        usuario.setApellidos(request.getApellidos());
        usuario.setNombreUsuario(request.getNombreUsuario());
        usuario.setCorreo(request.getCorreo());
        usuario.setContrasenaHash(passwordEncoder.encode(request.getContrasena()));
        // ID 2 para Cliente
        TipoUsuario tipoCliente = tipoUsuarioRepository.findById(2L)
                .orElseThrow(() -> new RuntimeException("Tipo de usuario 'Cliente' no existe"));
        usuario.setTipoUsuario(tipoCliente);
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setEstado(0); // 0 para Pendiente de verificación

        Usuario savedUser = usuarioRepository.save(usuario);

        // Generar y enviar código de verificación
        String codigo = String.format("%06d", new Random().nextInt(999999));
        registrationTokens.put(request.getCorreo(), codigo);
        emailService.enviarCodigoVerificacion(request.getCorreo(), codigo);

        if (auditoriaService != null) {
            auditoriaService.registrar(savedUser.getIdUsuario(), "usuario", savedUser.getIdUsuario(),
                    "REGISTRO", null, "{\"correo\":\"" + savedUser.getCorreo() + "\"}");
        }

        log.info("Usuario registrado (pendiente verif): {}. Codigo: {}", request.getCorreo(), codigo);

        return savedUser;
    }

    @Transactional
    public boolean verifyRegistration(String correo, String codigo) {
        String codigoGuardado = registrationTokens.get(correo);
        if (codigoGuardado != null && codigoGuardado.equals(codigo)) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(correo);
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                usuario.setEstado(1); // Activar usuario
                usuarioRepository.save(usuario);
                registrationTokens.remove(correo);
                if (auditoriaService != null) {
                    auditoriaService.registrar(usuario.getIdUsuario(), "usuario", usuario.getIdUsuario(),
                            "VERIFICACION_CORREO", "{\"estado\":0}", "{\"estado\":1}");
                }
                log.info("Usuario verificado y activado: {}", correo);
                return true;
            }
        }
        return false;
    }

    @Transactional
    public Usuario create(UsuarioRequest request) {
        Usuario usuario = new Usuario();
        usuario.setNombres(request.getNombres());
        usuario.setApellidos(request.getApellidos());
        usuario.setNombreUsuario(request.getNombreUsuario());
        usuario.setCorreo(request.getCorreo());
        usuario.setContrasenaHash(passwordEncoder.encode(request.getContrasenaHash()));
        if (request.getTipoUsuario() != null) {
            Long tipoId = Long.parseLong(request.getTipoUsuario());
            TipoUsuario tipo = tipoUsuarioRepository.findById(tipoId)
                    .orElseThrow(() -> new RuntimeException("Tipo de usuario con ID " + tipoId + " no existe"));
            usuario.setTipoUsuario(tipo);
        }
        usuario.setDescripcion(request.getDescripcion());
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setEstado(1);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Optional<Usuario> update(Long id, UsuarioRequest request) {
        return usuarioRepository.findById(id).map(usuario -> {
            usuario.setNombres(request.getNombres());
            usuario.setApellidos(request.getApellidos());
            usuario.setNombreUsuario(request.getNombreUsuario());
            usuario.setCorreo(request.getCorreo());
            usuario.setContrasenaHash(passwordEncoder.encode(request.getContrasenaHash()));
            if (request.getTipoUsuario() != null) {
                Long tipoId = Long.parseLong(request.getTipoUsuario());
                TipoUsuario tipo = tipoUsuarioRepository.findById(tipoId)
                        .orElseThrow(() -> new RuntimeException("Tipo de usuario con ID " + tipoId + " no existe"));
                usuario.setTipoUsuario(tipo);
            }
            usuario.setDescripcion(request.getDescripcion());
            Usuario saved = usuarioRepository.save(usuario);
            if (auditoriaService != null) {
                auditoriaService.registrar(saved.getIdUsuario(), "usuario", saved.getIdUsuario(),
                        "UPDATE", null, "{\"correo\":\"" + saved.getCorreo() + "\"}");
            }
            return saved;
        });
    }

    @Transactional
    public Optional<Usuario> updatePerfil(Long id, String nombres, String apellidos, String nombreUsuario, String descripcion) {
        return usuarioRepository.findById(id).map(usuario -> {
            if (nombres != null && !nombres.isBlank()) usuario.setNombres(nombres);
            if (apellidos != null && !apellidos.isBlank()) usuario.setApellidos(apellidos);
            if (nombreUsuario != null && !nombreUsuario.isBlank()) usuario.setNombreUsuario(nombreUsuario);
            usuario.setDescripcion(descripcion);
            Usuario saved = usuarioRepository.save(usuario);
            if (auditoriaService != null) {
                auditoriaService.registrar(saved.getIdUsuario(), "usuario", saved.getIdUsuario(),
                        "ACTUALIZAR_PERFIL", null, "{\"nombreUsuario\":\"" + saved.getNombreUsuario() + "\"}");
            }
            return saved;
        });
    }

    @Transactional(readOnly = true)
    public List<UsuarioBusquedaResponse> buscarUsuariosRegistrados(String q, Long excludeId) {
        String query = q == null ? "" : q.toLowerCase().trim();
        return usuarioRepository.findAll().stream()
                .filter(u -> u.getEstado() == 1 && (u.getTipoUsuario() == null || u.getTipoUsuario().getIdTipoUsuario() != 3))
                .filter(u -> excludeId == null || !u.getIdUsuario().equals(excludeId))
                .filter(u -> u.getCorreo() != null && u.getCorreo().toLowerCase().contains(query)
                        || u.getNombreUsuario() != null && u.getNombreUsuario().toLowerCase().contains(query)
                        || u.getNombres() != null && u.getNombres().toLowerCase().contains(query))
                .limit(10)
                .map(u -> new UsuarioBusquedaResponse(
                        u.getIdUsuario(),
                        (u.getNombres() + " " + (u.getApellidos() != null ? u.getApellidos() : "")).trim(),
                        u.getCorreo(),
                        u.getNombreUsuario()))
                .toList();
    }

    /**
     * Reclamación de perfil: convierte una cuenta fantasma (tipo FANTASMA)
     * en una cuenta real usando el tokenReclamo del usuario fantasma.
     */
    @Transactional
    public Usuario reclamarPerfil(String tokenReclamo, String nombres, String apellidos,
                                   String nombreUsuario, String correo, String contrasena) {
        Usuario fantasma = usuarioRepository.findAll().stream()
                .filter(u -> tokenReclamo.equals(u.getTokenReclamo()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("TOKEN_INVALIDO"));

        if (usuarioRepository.findByCorreo(correo)
                .filter(u -> !u.getIdUsuario().equals(fantasma.getIdUsuario()))
                .isPresent()) {
            throw new RuntimeException("CORREO_EN_USO");
        }
        if (usuarioRepository.findByNombreUsuario(nombreUsuario)
                .filter(u -> !u.getIdUsuario().equals(fantasma.getIdUsuario()))
                .isPresent()) {
            throw new RuntimeException("NOMBRE_EN_USO");
        }

        TipoUsuario tipoCliente = tipoUsuarioRepository.findById(2L)
                .orElseThrow(() -> new RuntimeException("Tipo de usuario 'Cliente' no existe"));

        fantasma.setNombres(nombres);
        fantasma.setApellidos(apellidos);
        fantasma.setNombreUsuario(nombreUsuario);
        fantasma.setCorreo(correo);
        fantasma.setContrasenaHash(passwordEncoder.encode(contrasena));
        fantasma.setTipoUsuario(tipoCliente);
        fantasma.setEstado(1);
        fantasma.setTokenReclamo(null);

        Usuario reclamado = usuarioRepository.save(fantasma);
        if (auditoriaService != null) {
            auditoriaService.registrar(reclamado.getIdUsuario(), "usuario", reclamado.getIdUsuario(),
                    "RECLAMACION_PERFIL", "{\"tipo\":\"FANTASMA\"}", "{\"tipo\":\"CLIENTE\",\"correo\":\"" + correo + "\"}");
        }
        return reclamado;
    }

    @Transactional
    public void delete(Long id) {
        usuarioRepository.deleteById(id);
    }
}
