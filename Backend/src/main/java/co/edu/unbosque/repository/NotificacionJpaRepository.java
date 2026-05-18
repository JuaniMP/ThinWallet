package co.edu.unbosque.repository;

import co.edu.unbosque.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionJpaRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByIdUsuarioDestinoOrderByFechaCreacionDesc(Long idUsuarioDestino);
    long countByIdUsuarioDestinoAndLeidaFalse(Long idUsuarioDestino);
    void deleteByIdUsuarioDestino(Long idUsuarioDestino);

    @Modifying
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.idUsuarioDestino = :idUsuario AND n.leida = false")
    int marcarTodasLeidasByUsuario(@Param("idUsuario") Long idUsuario);
}
