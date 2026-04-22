package co.edu.unbosque.repository;

import co.edu.unbosque.entity.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {
    List<Transaccion> findByIdUsuario(Long idUsuario);
    List<Transaccion> findByIdCirculoGasto(Long idCirculoGasto);
    List<Transaccion> findByIdCategoria(Long idCategoria);

    @Query(value = "SELECT COALESCE(SUM(CASE " +
            "WHEN t.tipo_movimiento = 'DEPOSITO' THEN t.monto_original * COALESCE(t.tasa_cambio, 1.0) " +
            "WHEN t.tipo_movimiento = 'RETIRO' THEN -1 * t.monto_original * COALESCE(t.tasa_cambio, 1.0) " +
            "ELSE 0 END), 0) " +
            "FROM transaccion t WHERE t.id_usuario = :idUsuario", nativeQuery = true)
    BigDecimal calculateSaldoTotalByUsuario(@Param("idUsuario") Long idUsuario);
}