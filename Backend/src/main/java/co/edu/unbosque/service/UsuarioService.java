package co.edu.unbosque.service;

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

    @Transactional(readOnly = true)
    public Optional<Usuario> login(LoginRequest request) {
        return usuarioRepository.findByCorreo(request.getCorreo())
                .filter(usuario -> passwordEncoder.matches(request.getContrasena(), usuario.getContrasenaHash()));
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> loginWithToken(String tokenReclamo) {
        // Obtener todos los usuarios para validar contra tokens hasheados en BD
        List<Usuario> todosUsuarios = usuarioRepository.findAll();
        for (Usuario usuario : todosUsuarios) {
            if (usuario.getTokenReclamo() != null && 
                tokenHashingService.validateToken(tokenReclamo, usuario.getTokenReclamo())) {
                return Optional.of(usuario);
            }
        }
        return Optional.empty();
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
        resetTokens.remove(correo);
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
            return usuarioRepository.save(usuario);
        });
    }

    @Transactional
    public void delete(Long id) {
        usuarioRepository.deleteById(id);
    }
}