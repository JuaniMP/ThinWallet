package co.edu.unbosque.service;

import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.repository.UsuarioRepository;
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
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Almacena temporalmente los tokens de recuperacion: <Correo, Codigo>
    private final Map<String, String> resetTokens = new ConcurrentHashMap<>();

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

    public void solicitarRecuperacionPassword(String correo) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(correo);
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("No existe un usuario con ese correo electrónico");
        }
        
        // Generar codigo aleatorio de 6 digitos
        String codigo = String.format("%06d", new Random().nextInt(999999));
        
        // Guardar token en memoria
        resetTokens.put(correo, codigo);
        
        // Enviar correo
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

        // Remover el token luego de usarlo para evitar re-uso
        resetTokens.remove(correo);
        log.info("Contrasena actualizada exitosamente para {}", correo);
    }

    @Transactional
    public Usuario register(RegisterRequest request) {
        Usuario usuario = new Usuario();
        usuario.setNombres(request.getNombres());
        usuario.setApellidos(request.getApellidos());
        usuario.setNombreUsuario(request.getNombreUsuario());
        usuario.setCorreo(request.getCorreo());
        usuario.setContrasenaHash(passwordEncoder.encode(request.getContrasena()));
        usuario.setTipoUsuario("CLIENTE");
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setEstado(1);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario create(UsuarioRequest request) {
        Usuario usuario = new Usuario();
        usuario.setNombres(request.getNombres());
        usuario.setApellidos(request.getApellidos());
        usuario.setNombreUsuario(request.getNombreUsuario());
        usuario.setCorreo(request.getCorreo());
        usuario.setContrasenaHash(passwordEncoder.encode(request.getContrasenaHash()));
        usuario.setTipoUsuario(request.getTipoUsuario());
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
            usuario.setTipoUsuario(request.getTipoUsuario());
            usuario.setDescripcion(request.getDescripcion());
            return usuarioRepository.save(usuario);
        });
    }

    @Transactional
    public void delete(Long id) {
        usuarioRepository.deleteById(id);
    }
}