package co.edu.unbosque.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoint temporal para ejecutar migraciones SQL en producción.
 * ELIMINAR después de ejecutar.
 */
@RestController
@RequestMapping("/api/migracion")
@RequiredArgsConstructor
public class MigracionController {

    private final JdbcTemplate jdbcTemplate;

    @PostMapping("/fn-recomendar-ahorro")
    public Map<String, String> crearFnRecomendarAhorro(@RequestHeader("X-Admin-Key") String key) {
        if (!"thinwallet-admin-2026".equals(key)) {
            return Map.of("error", "No autorizado");
        }
        try {
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS fn_recomendar_ahorro");
            jdbcTemplate.execute("""
                CREATE FUNCTION fn_recomendar_ahorro(
                    p_id_usuario      INT,
                    p_ingreso_mensual DECIMAL(15,2)
                )
                RETURNS JSON
                DETERMINISTIC
                READS SQL DATA
                BEGIN
                    DECLARE v_gastos        DECIMAL(15,2) DEFAULT 0;
                    DECLARE v_necesidades   DECIMAL(15,2) DEFAULT 0;
                    DECLARE v_deseos        DECIMAL(15,2) DEFAULT 0;
                    DECLARE v_ahorro        DECIMAL(15,2) DEFAULT 0;
                    DECLARE v_sobrante      DECIMAL(15,2) DEFAULT 0;
                    DECLARE v_cumplimiento  DECIMAL(5,2)  DEFAULT 0;
                    SET v_necesidades = ROUND(p_ingreso_mensual * 0.50, 2);
                    SET v_deseos      = ROUND(p_ingreso_mensual * 0.30, 2);
                    SET v_ahorro      = ROUND(p_ingreso_mensual * 0.20, 2);
                    SELECT COALESCE(SUM(t.monto_original), 0)
                    INTO   v_gastos
                    FROM   transaccion t
                    INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
                    WHERE  t.id_usuario   = p_id_usuario
                      AND  UPPER(tm.nombre) IN ('RETIRO','GASTO','EGRESO');
                    SET v_sobrante = p_ingreso_mensual - v_gastos;
                    IF p_ingreso_mensual > 0 THEN
                        SET v_cumplimiento = ROUND((v_sobrante / (p_ingreso_mensual * 0.20)) * 100, 2);
                        IF v_cumplimiento < 0 THEN SET v_cumplimiento = 0; END IF;
                        IF v_cumplimiento > 100 THEN SET v_cumplimiento = 100; END IF;
                    END IF;
                    RETURN JSON_OBJECT(
                        'ingreso_mensual', p_ingreso_mensual,
                        'necesidades_max', v_necesidades,
                        'deseos_max',      v_deseos,
                        'ahorro_objetivo', v_ahorro,
                        'gastos_actuales', v_gastos,
                        'sobrante',        v_sobrante,
                        'cumplimiento',    v_cumplimiento
                    );
                END
                """);
            return Map.of("resultado", "fn_recomendar_ahorro creada exitosamente");
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }
}
