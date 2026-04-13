package co.edu.unbosque.repository;

import co.edu.unbosque.entity.AuditoriaSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditoriaSistemaRepository extends JpaRepository<AuditoriaSistema, Long> {
    List<AuditoriaSistema> findByIdUsuario(Long idUsuario);
    List<AuditoriaSistema> findByTablaAfectada(String tablaAfectada);
    List<AuditoriaSistema> findByRegistroId(Long registroId);
}