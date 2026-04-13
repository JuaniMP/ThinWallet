package co.edu.unbosque.repository;

import co.edu.unbosque.entity.Deuda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeudaRepository extends JpaRepository<Deuda, Long> {
    List<Deuda> findByIdUsuarioDeudor(Long idUsuarioDeudor);
    List<Deuda> findByIdUsuarioAcreedor(Long idUsuarioAcreedor);
    List<Deuda> findByIdTransaccion(Long idTransaccion);
    List<Deuda> findByEstadoPago(String estadoPago);
}