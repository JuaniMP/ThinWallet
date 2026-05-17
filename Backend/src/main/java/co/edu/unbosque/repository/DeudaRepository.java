package co.edu.unbosque.repository;

import co.edu.unbosque.entity.Deuda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeudaRepository extends JpaRepository<Deuda, Long> {
    @Query("SELECT d FROM Deuda d WHERE d.idUsuarioDeudor = :idUsuario")
    List<Deuda> findByDeudor(@Param("idUsuario") Long idUsuario);

    @Query("SELECT d FROM Deuda d WHERE d.idUsuarioAcreedor = :idUsuario")
    List<Deuda> findByAcreedor(@Param("idUsuario") Long idUsuario);

    @Query("SELECT d FROM Deuda d WHERE d.idTransaccion = :idTransaccion")
    List<Deuda> findByIdTransaccion(@Param("idTransaccion") Long idTransaccion);

    @Query("SELECT d FROM Deuda d WHERE d.estadoPago = :estadoPago")
    List<Deuda> findByEstadoPago(@Param("estadoPago") String estadoPago);
}