package co.edu.unbosque.repository;

import co.edu.unbosque.entity.UsuarioGasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UsuarioGastoRepository extends JpaRepository<UsuarioGasto, Long> {
    List<UsuarioGasto> findByIdUsuario(Long idUsuario);
    List<UsuarioGasto> findByIdGasto(Long idGasto);
}