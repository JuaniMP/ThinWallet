package co.edu.unbosque.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Sincroniza las definiciones de funciones MySQL con el script SQL al arranque
 * del backend. Cada migración es idempotente (DROP IF EXISTS + CREATE).
 *
 * Necesario porque dos funciones del script original filtraban por
 * tipo_movimiento.nombre (EFECTIVO/TARJETA/...) en vez de categoria.tipo_categoria
 * (DEPOSITO/RETIRO/...), así que siempre devolvían 0.
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
        actualizarFnContarGastosHormiga();
        actualizarSpAsignarMesada();
    }

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
            log.info("Migración SQL: fn_balance_usuario_periodo actualizada");
        } catch (Exception e) {
            log.warn("Migración SQL fn_balance_usuario_periodo falló: {}", e.getMessage());
        }
    }

    /**
     * sp_asignar_mesada — el script original no incluía monto_actual en el INSERT,
     * pero la columna fue agregada como NOT NULL en producción y el SP fallaba con
     * "Error al asignar mesada". Se reescribe con monto_actual = 0.
     */
    private void actualizarSpAsignarMesada() {
        try {
            jdbcTemplate.execute("DROP PROCEDURE IF EXISTS sp_asignar_mesada");
            jdbcTemplate.execute(
                "CREATE PROCEDURE sp_asignar_mesada(" +
                "    IN  p_id_circulo  INT, " +
                "    IN  p_id_miembro  INT, " +
                "    IN  p_monto       DECIMAL(15,2), " +
                "    IN  p_periodo     VARCHAR(50), " +
                "    IN  p_id_admin    INT, " +
                "    OUT p_resultado   INT, " +
                "    OUT p_mensaje     VARCHAR(500)" +
                ") main: BEGIN " +
                "  DECLARE v_es_admin       INT DEFAULT 0; " +
                "  DECLARE v_existe_miembro INT DEFAULT 0; " +
                "  DECLARE v_id_categoria   INT DEFAULT NULL; " +
                "  DECLARE EXIT HANDLER FOR SQLEXCEPTION " +
                "  BEGIN " +
                "    ROLLBACK; " +
                "    SET p_resultado = 0; " +
                "    SET p_mensaje   = 'Error al asignar mesada'; " +
                "  END; " +
                "  SELECT COUNT(*) INTO v_es_admin FROM circulo_gasto " +
                "    WHERE id_circulo_gasto = p_id_circulo AND id_usuario_creador = p_id_admin; " +
                "  IF v_es_admin = 0 THEN " +
                "    SET p_resultado = 0; SET p_mensaje = 'No tienes permisos para asignar mesadas'; LEAVE main; " +
                "  END IF; " +
                "  SELECT COUNT(*) INTO v_existe_miembro FROM usuario_circulo " +
                "    WHERE id_circulo_gasto = p_id_circulo AND id_usuario = p_id_miembro; " +
                "  IF v_existe_miembro = 0 THEN " +
                "    SET p_resultado = 0; SET p_mensaje = 'El usuario no es miembro de este círculo'; LEAVE main; " +
                "  END IF; " +
                "  SELECT id_categoria INTO v_id_categoria FROM categoria WHERE nombre = 'Mesada' LIMIT 1; " +
                "  IF v_id_categoria IS NULL THEN " +
                "    SELECT MIN(id_categoria) INTO v_id_categoria FROM categoria; " +
                "  END IF; " +
                "  START TRANSACTION; " +
                "  INSERT INTO gasto (nombre, valor, periodicidad, fecha_inicio, " +
                "                     id_usuario_creador, id_circulo_gasto, id_categoria, monto_actual) " +
                "  VALUES (CONCAT('Mesada para usuario ', p_id_miembro), p_monto, p_periodo, NOW(), " +
                "          p_id_admin, p_id_circulo, v_id_categoria, 0); " +
                "  COMMIT; " +
                "  SET p_resultado = 1; " +
                "  SET p_mensaje   = 'Mesada asignada exitosamente.'; " +
                "END"
            );
            log.info("Migración SQL: sp_asignar_mesada actualizada (incluye monto_actual)");
        } catch (Exception e) {
            log.warn("Migración SQL sp_asignar_mesada falló: {}", e.getMessage());
        }
    }

    private void actualizarFnContarGastosHormiga() {
        try {
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS fn_contar_gastos_hormiga");
            jdbcTemplate.execute(
                "CREATE FUNCTION fn_contar_gastos_hormiga(" +
                "    p_id_usuario   INT, " +
                "    p_umbral_monto DECIMAL(15,2), " +
                "    p_dias         INT" +
                ") RETURNS INT " +
                "DETERMINISTIC READS SQL DATA " +
                "BEGIN " +
                "  DECLARE v_cantidad INT DEFAULT 0; " +
                "  SELECT COUNT(*) INTO v_cantidad " +
                "    FROM transaccion t " +
                "    INNER JOIN categoria c ON t.id_categoria = c.id_categoria " +
                "    WHERE t.id_usuario = p_id_usuario " +
                "      AND t.id_circulo_gasto IS NULL " +
                "      AND UPPER(c.tipo_categoria) <> 'DEPOSITO' " +
                "      AND t.monto_original <= p_umbral_monto " +
                "      AND t.fecha_ejecucion >= DATE_SUB(NOW(), INTERVAL p_dias DAY); " +
                "  RETURN v_cantidad; " +
                "END"
            );
            log.info("Migración SQL: fn_contar_gastos_hormiga actualizada");
        } catch (Exception e) {
            log.warn("Migración SQL fn_contar_gastos_hormiga falló: {}", e.getMessage());
        }
    }
}
