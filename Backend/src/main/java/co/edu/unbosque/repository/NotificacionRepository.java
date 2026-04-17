package co.edu.unbosque.repository;

import co.edu.unbosque.document.Notificacion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends MongoRepository<Notificacion, String> {
    List<Notificacion> findByIdUsuarioDestinoOrderByFechaCreacionDesc(Long idUsuarioDestino);
    long countByIdUsuarioDestinoAndLeidaFalse(Long idUsuarioDestino);
    void deleteByIdUsuarioDestino(Long idUsuarioDestino);
}
