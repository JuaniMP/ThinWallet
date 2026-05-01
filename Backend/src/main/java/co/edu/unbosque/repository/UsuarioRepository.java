package co.edu.unbosque.repository;

import co.edu.unbosque.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCorreo(String correo);
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
    Optional<Usuario> findByTokenReclamo(String tokenReclamo);
    boolean existsByTokenReclamo(String tokenReclamo);
}