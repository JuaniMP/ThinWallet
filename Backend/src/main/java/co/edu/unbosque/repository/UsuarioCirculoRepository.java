package co.edu.unbosque.repository;

import co.edu.unbosque.entity.UsuarioCirculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UsuarioCirculoRepository extends JpaRepository<UsuarioCirculo, Long> {
    List<UsuarioCirculo> findByIdUsuario(Long idUsuario);
    List<UsuarioCirculo> findByIdCirculoGasto(Long idCirculoGasto);
}