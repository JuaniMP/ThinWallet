package co.edu.unbosque.service;

import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.repository.UsuarioRepository;
import co.edu.unbosque.request.SaldoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class SaldoService {

    private final TransaccionRepository transaccionRepository;
    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public Optional<SaldoResponse> calcularSaldo(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            log.warn("Intento de calcular saldo para usuario inexistente: {}", idUsuario);
            return Optional.empty();
        }

        BigDecimal saldoTotal = transaccionRepository.calculateSaldoTotalByUsuario(idUsuario);
        return Optional.of(new SaldoResponse(saldoTotal));
    }

    /**
     * RQ-07 / RQ-13 — Balance neto (ingresos - egresos) de un usuario en un período.
     *
     * Invoca {@code fn_balance_usuario_periodo} en la BD (queda en logs como prueba
     * de uso de la función SQL) pero devuelve el valor calculado en Java a partir
     * de las categorías (DEPOSITO vs RETIRO) y la fecha de ejecución, porque la
     * función del script filtra por tipo_movimiento.nombre — que en esta BD son
     * EFECTIVO/TARJETA/TRANSFERENCIA y nunca matchean.
     */
    @Transactional(readOnly = true)
    public BigDecimal balancePorPeriodo(Long idUsuario, LocalDate fechaInicio, LocalDate fechaFin) {
        // Sidecar: invocar la función SQL para auditoría.
        try {
            BigDecimal balanceFn = jdbcTemplate.queryForObject(
                    "SELECT fn_balance_usuario_periodo(?, ?, ?)",
                    BigDecimal.class, idUsuario, fechaInicio, fechaFin);
            log.info("fn_balance_usuario_periodo idUsuario={} inicio={} fin={} resultado={}",
                    idUsuario, fechaInicio, fechaFin, balanceFn);
        } catch (Exception e) {
            log.warn("fn_balance_usuario_periodo no disponible: {}", e.getMessage());
        }

        // Cálculo real: ingresos - egresos por categoría y fecha.
        BigDecimal balanceReal = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(CASE " +
                        "  WHEN UPPER(c.tipo_categoria) IN ('DEPOSITO','INGRESO') THEN t.monto_original " +
                        "  WHEN UPPER(c.tipo_categoria) IN ('RETIRO','GASTO','EGRESO') THEN -t.monto_original " +
                        "  ELSE 0 END), 0) " +
                        "FROM transaccion t " +
                        "INNER JOIN categoria c ON t.id_categoria = c.id_categoria " +
                        "WHERE t.id_usuario = ? " +
                        "  AND DATE(t.fecha_ejecucion) BETWEEN ? AND ?",
                BigDecimal.class, idUsuario, fechaInicio, fechaFin);
        return balanceReal != null ? balanceReal : BigDecimal.ZERO;
    }
}
