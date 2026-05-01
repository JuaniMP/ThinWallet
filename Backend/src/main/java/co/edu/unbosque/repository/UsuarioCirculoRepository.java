package co.edu.unbosque.repository;

import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.entity.UsuarioCirculoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface UsuarioCirculoRepository extends JpaRepository<UsuarioCirculo, UsuarioCirculoId> {

    // Ajustado al nombre real: idCirculoGasto
    List<UsuarioCirculo> findByUsuario_IdUsuario(Long idUsuario);

    List<UsuarioCirculo> findByCirculoGasto_IdCirculoGasto(Long idCirculoGasto);

    @Transactional
    @Modifying
    @Query("DELETE FROM UsuarioCirculo uc WHERE uc.circuloGasto.idCirculoGasto = :idCirculoGasto")
    void deleteByCirculoGastoId(@Param("idCirculoGasto") Long idCirculoGasto);
}