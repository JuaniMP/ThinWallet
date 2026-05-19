package co.edu.unbosque.service;

import co.edu.unbosque.dto.CoachRecomendacionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * RF-11 — Coach Financiero: aplica la regla 50/30/20 sobre el ingreso
 * declarado por el usuario y produce recomendaciones accionables.
 *
 * Clasifica las categorías por nombre/tipo:
 *   NECESIDAD → vivienda, comida, transporte, servicios, salud, educación
 *   DESEO     → entretenimiento, ropa, suscripciones, resto
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CoachFinancieroService {

    private static final BigDecimal PCT_NECESIDADES = new BigDecimal("0.50");
    private static final BigDecimal PCT_DESEOS      = new BigDecimal("0.30");
    private static final BigDecimal PCT_AHORRO      = new BigDecimal("0.20");

    private static final Set<String> KEYWORDS_NECESIDAD = Set.of(
            "VIVIENDA", "ARRIENDO", "HOGAR", "ALIMENTACION", "ALIMENTACIÓN", "COMIDA",
            "MERCADO", "TRANSPORTE", "GASOLINA", "SERVICIOS", "SERVICIO",
            "SALUD", "MEDICINA", "EDUCACION", "EDUCACIÓN", "ESTUDIOS", "LUZ", "AGUA",
            "INTERNET", "GAS", "ARRENDAMIENTO");

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public CoachRecomendacionResponse recomendar(Long idUsuario, BigDecimal ingresoMensual) {
        if (ingresoMensual == null || ingresoMensual.signum() <= 0) {
            // Sin sueldo declarado, estimamos a partir de ingresos del último periodo.
            ingresoMensual = inferirIngresoMensual(idUsuario);
        }

        Map<String, BigDecimal> gastoPorCategoria = sumarGastosPorCategoria(idUsuario);
        BigDecimal gastoNecesidades = BigDecimal.ZERO;
        BigDecimal gastoDeseos      = BigDecimal.ZERO;

        for (Map.Entry<String, BigDecimal> e : gastoPorCategoria.entrySet()) {
            if (esNecesidad(e.getKey())) {
                gastoNecesidades = gastoNecesidades.add(e.getValue());
            } else {
                gastoDeseos = gastoDeseos.add(e.getValue());
            }
        }
        BigDecimal gastoTotal = gastoNecesidades.add(gastoDeseos);

        BigDecimal necesidadesMax = ingresoMensual.multiply(PCT_NECESIDADES).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deseosMax      = ingresoMensual.multiply(PCT_DESEOS).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ahorroObjetivo = ingresoMensual.multiply(PCT_AHORRO).setScale(2, RoundingMode.HALF_UP);

        BigDecimal pctNec = porcentajeDe(gastoNecesidades, necesidadesMax);
        BigDecimal pctDes = porcentajeDe(gastoDeseos,      deseosMax);
        BigDecimal sobrante = ingresoMensual.subtract(gastoTotal);
        BigDecimal cumplimientoAhorro = porcentajeDe(sobrante.max(BigDecimal.ZERO), ahorroObjetivo);

        List<String> recomendaciones = construirRecomendaciones(
                ingresoMensual, pctNec, pctDes, sobrante, ahorroObjetivo, gastoPorCategoria);

        return new CoachRecomendacionResponse(
                idUsuario, ingresoMensual,
                necesidadesMax, deseosMax, ahorroObjetivo,
                gastoNecesidades, gastoDeseos, gastoTotal,
                pctNec, pctDes, cumplimientoAhorro,
                recomendaciones, gastoPorCategoria);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private BigDecimal inferirIngresoMensual(Long idUsuario) {
        String sql = """
                SELECT COALESCE(SUM(t.monto_original), 0) AS total
                FROM   transaccion t
                INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
                WHERE  t.id_usuario = ?
                  AND  UPPER(tm.nombre) IN ('DEPOSITO','INGRESO')
                """;
        BigDecimal total = jdbcTemplate.queryForObject(sql, BigDecimal.class, idUsuario);
        return total != null ? total : BigDecimal.ZERO;
    }

    private Map<String, BigDecimal> sumarGastosPorCategoria(Long idUsuario) {
        String sql = """
                SELECT COALESCE(c.nombre, 'Sin categoria') AS categoria,
                       COALESCE(SUM(t.monto_original), 0)  AS total
                FROM   transaccion t
                INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
                LEFT  JOIN categoria c        ON c.id_categoria       = t.id_categoria
                WHERE  t.id_usuario = ?
                  AND  UPPER(tm.nombre) IN ('RETIRO','GASTO','EGRESO')
                GROUP BY c.nombre
                ORDER BY total DESC
                """;
        Map<String, BigDecimal> mapa = new LinkedHashMap<>();
        jdbcTemplate.query(sql, rs -> {
            mapa.put(rs.getString("categoria"), rs.getBigDecimal("total"));
        }, idUsuario);
        return mapa;
    }

    private boolean esNecesidad(String nombreCategoria) {
        if (nombreCategoria == null) return false;
        String up = nombreCategoria.toUpperCase();
        for (String k : KEYWORDS_NECESIDAD) {
            if (up.contains(k)) return true;
        }
        return false;
    }

    private BigDecimal porcentajeDe(BigDecimal valor, BigDecimal limite) {
        if (limite == null || limite.signum() == 0) return BigDecimal.ZERO;
        return valor.multiply(new BigDecimal("100"))
                .divide(limite, 2, RoundingMode.HALF_UP);
    }

    private List<String> construirRecomendaciones(
            BigDecimal ingreso, BigDecimal pctNec, BigDecimal pctDes,
            BigDecimal sobrante, BigDecimal ahorroObjetivo,
            Map<String, BigDecimal> gastoPorCategoria) {
        List<String> tips = new ArrayList<>();

        if (ingreso.signum() <= 0) {
            tips.add("Registra tu ingreso mensual para activar las recomendaciones personalizadas.");
            return tips;
        }
        if (pctNec.compareTo(new BigDecimal("100")) > 0) {
            tips.add("Tus gastos esenciales superan el 50% del ingreso. Revisa vivienda, servicios y transporte.");
        }
        if (pctDes.compareTo(new BigDecimal("100")) > 0) {
            tips.add("Estás gastando más del 30% en deseos. Pausa suscripciones y planes de ocio este mes.");
        }
        if (sobrante.compareTo(ahorroObjetivo) >= 0) {
            tips.add("¡Bien! Estás superando tu meta de ahorro mensual.");
        } else if (sobrante.signum() > 0) {
            BigDecimal falta = ahorroObjetivo.subtract(sobrante).setScale(2, RoundingMode.HALF_UP);
            tips.add("Te faltan $" + falta + " para alcanzar la meta de ahorro 20%.");
        } else {
            tips.add("Estás gastando más de lo que ingresas. Recorta primero gastos no esenciales.");
        }
        // Top categoría
        gastoPorCategoria.entrySet().stream().findFirst().ifPresent(top -> {
            tips.add("Tu mayor gasto está en \"" + top.getKey() + "\" ($" + top.getValue() + "). " +
                    (esNecesidad(top.getKey()) ? "Negocia tarifas o busca alternativas más baratas."
                                                : "Considera reducirlo el próximo mes."));
        });
        if (tips.isEmpty()) tips.add("Tus finanzas están alineadas con la regla 50/30/20.");
        return tips;
    }

    /**
     * RQ-11 — Delegación a {@code fn_recomendar_ahorro}: calcula la regla 50/30/20
     * directamente en la capa de datos y devuelve el JSON producido por la función.
     */
    @Transactional(readOnly = true)
    public String recomendarConFuncionBD(Long idUsuario, BigDecimal ingresoMensual) {
        BigDecimal ingreso = (ingresoMensual != null && ingresoMensual.signum() > 0)
                ? ingresoMensual : inferirIngresoMensual(idUsuario);
        try {
            String json = jdbcTemplate.queryForObject(
                    "SELECT fn_recomendar_ahorro(?, ?)", String.class, idUsuario, ingreso);
            log.info("fn_recomendar_ahorro idUsuario={} ingreso={} -> {}", idUsuario, ingreso, json);
            return json != null ? json : "{}";
        } catch (Exception e) {
            log.warn("fn_recomendar_ahorro no disponible: {}", e.getMessage());
            return "{\"error\":\"fn_recomendar_ahorro no está desplegada en la BD. Ejecuta el script SQL en producción.\"}";
        }
    }

    // Wrapper utilizado por el controller cuando el frontend pide la regla cruda
    public List<String> reglasReferencia() {
        return Arrays.asList(
                "50% Necesidades: vivienda, comida, transporte, servicios, salud, educación",
                "30% Deseos: entretenimiento, ropa, suscripciones, restaurantes",
                "20% Ahorro: fondo de emergencia, metas y deudas a largo plazo"
        );
    }
}
