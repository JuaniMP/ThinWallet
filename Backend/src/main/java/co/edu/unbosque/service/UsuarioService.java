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
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

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