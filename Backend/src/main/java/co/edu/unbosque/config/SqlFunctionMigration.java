package co.edu.unbosque.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Actualiza definiciones de funciones MySQL al arrancar el backend.
 *
 * Se ejecuta una vez por deploy. Cada migración es idempotente: hace DROP IF EXISTS
 * + CREATE, así que da igual si la función ya existía.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(10)
public class SqlFunctionMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        actualizarFnBalanceUsuarioPeriodo();
    }

    /**
     * fn_balance_usuario_periodo — antes filtraba por tipo_movimiento.nombre
     * (EFECTIVO/TARJETA/...) y devolvía 0. Ahora joinea con categoria.tipo_categoria
     * y filtra por fecha_ejecucion dentro del rango.
     */
    private void actualizarFnBalanceUsuarioPeriodo() {
        try {
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS fn_balance_usuario_periodo");
            jdbcTemplate.execute(
                "CREATE FUNCTION fn_balance_usuario_periodo(" +
                "    p_id_usuario   INT, " +
                "    p_fecha_inicio DATE, " +
                "    p_fecha_fin    DATE" +
                ") RETURNS DECIMAL(15,2) " +
                "DETERMINISTIC READS SQL DATA " +
                "BEGIN " +
                "  DECLARE v_ingresos DECIMAL(15,2) DEFAULT 0; " +
                "  DECLARE v_egresos  DECIMAL(15,2) DEFAULT 0; " +
                "  SELECT COALESCE(SUM(t.monto_original),0) INTO v_ingresos " +
                "    FROM transaccion t " +
                "    INNER JOIN categoria c ON t.id_categoria = c.id_categoria " +
                "    WHERE t.id_usuario = p_id_usuario " +
                "      AND DATE(t.fecha_ejecucion) BETWEEN p_fecha_inicio AND p_fecha_fin " +
                "      AND UPPER(c.tipo_categoria) IN ('DEPOSITO','INGRESO'); " +
                "  SELECT COALESCE(SUM(t.monto_original),0) INTO v_egresos " +
                "    FROM transaccion t " +
                "    INNER JOIN categoria c ON t.id_categoria = c.id_categoria " +
                "    WHERE t.id_usuario = p_id_usuario " +
                "      AND DATE(t.fecha_ejecucion) BETWEEN p_fecha_inicio AND p_fecha_fin " +
                "      AND UPPER(c.tipo_categoria) IN ('RETIRO','GASTO','EGRESO'); " +
                "  RETURN ROUND(v_ingresos - v_egresos, 2); " +
                "END"
            );
            log.info("Migración SQL: fn_balance_usuario_periodo actualizada (filtra por categoria + fechas)");
        } catch (Exception e) {
            log.warn("Migración SQL fn_balance_usuario_periodo falló: {}", e.getMessage());
        }
    }
}
