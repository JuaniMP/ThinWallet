package co.edu.unbosque.config;

import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Resuelve el usuario dueño del JWT de la petición actual.
 * JwtAuthenticationFilter deja el correo como principal; aquí se traduce a id.
 */
@Component
@RequiredArgsConstructor
public class UsuarioAutenticado {

    private final UsuarioRepository usuarioRepository;

    public Long id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Sesión no válida");
        }
        return usuarioRepository.findByCorreo(auth.getName())
                .map(Usuario::getIdUsuario)
                .orElseThrow(() -> new AccessDeniedException("Sesión no válida"));
    }

    /** Lanza 403 si el id solicitado no es el del usuario autenticado. */
    public void exigirQueSea(Long idUsuario) {
        if (!Objects.equals(id(), idUsuario)) {
            throw new AccessDeniedException("No puedes acceder a los datos de otro usuario");
        }
    }
}
