package co.edu.unbosque.repository;

import co.edu.unbosque.entity.CirculoGasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CirculoGastoRepository extends JpaRepository<CirculoGasto, Long> {
    List<CirculoGasto> findByIdUsuarioCreador(Long idUsuarioCreador);
    Optional<CirculoGasto> findByTokenInvitacion(String tokenInvitacion);
}