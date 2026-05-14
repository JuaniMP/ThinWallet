package co.edu.unbosque.repository;

import co.edu.unbosque.entity.UsuarioGasto;
import co.edu.unbosque.entity.UsuarioGastoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UsuarioGastoRepository extends JpaRepository<UsuarioGasto, UsuarioGastoId> {

    @Query("SELECT ug FROM UsuarioGasto ug WHERE ug.id.idUsuario = :idUsuario")
    List<UsuarioGasto> findByIdUsuario(@Param("idUsuario") Long idUsuario);

    @Query("SELECT ug FROM UsuarioGasto ug WHERE ug.id.idGasto = :idGasto")
    List<UsuarioGasto> findByIdGasto(@Param("idGasto") Long idGasto);
}
