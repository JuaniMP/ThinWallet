package co.edu.unbosque.repository;

import co.edu.unbosque.entity.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {
    List<Transaccion> findByIdUsuario(Long idUsuario);
    List<Transaccion> findByIdCirculoGasto(Long idCirculoGasto);
    List<Transaccion> findByIdCategoria(Long idCategoria);
}