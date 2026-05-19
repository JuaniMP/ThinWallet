package co.edu.unbosque.service;

import co.edu.unbosque.dto.GastosHormigaResponse;
import co.edu.unbosque.entity.Transaccion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Detección de "gastos hormiga": micro-gastos personales (sin círculo) que,
 * sumados, erosionan el balance del usuario sin que él los note.
 *
 * Un egreso se identifica por la categoría asociada: tipo_categoria != 'DEPOSITO'.
 * La función fn_contar_gastos_hormiga tiene un bug conocido (filtra por
 * tipo_movimiento.nombre con valores que no existen), por lo que tanto el conteo
 * como el listado se calculan directamente aquí con la lógica correcta.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GastosHormigaService {

    private static final BigDecimal UMBRAL_DEFAULT = new BigDecimal("20000");
    private static final int DIAS_DEFAULT = 30;

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public GastosHormigaResponse detectar(Long idUsuario, BigDecimal umbral, Integer dias) {
        BigDecimal u = umbral != null ? umbral : UMBRAL_DEFAULT;
        Integer d = dias != null ? dias : DIAS_DEFAULT;

        // Gastos: transacciones personales (sin círculo) cuya categoría NO es DEPOSITO
        // y cuyo monto está dentro del umbral, dentro del período de días indicado.
        String sql = """
                SELECT t.id_transaccion, t.nombre, t.monto_original, t.moneda_original,
                       t.tasa_cambio, t.modalidad_division, t.contexto,
                       t.id_usuario, t.id_circulo_gasto, t.id_categoria,
                       t.id_gasto, t.id_tipo_movimiento,
                       c.tipo_categoria AS tipo_categoria
                FROM   transaccion t
                INNER JOIN categoria c ON t.id_categoria = c.id_categoria
                WHERE  t.id_usuario        = ?
                  AND  t.id_circulo_gasto  IS NULL
                  AND  UPPER(c.tipo_categoria) <> 'DEPOSITO'
                  AND  t.monto_original    <= ?
                  AND  t.fecha_ejecucion  >= DATE_SUB(NOW(), INTERVAL ? DAY)
                ORDER BY t.id_transaccion DESC
                """;

        List<Transaccion> transacciones = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Transaccion t = new Transaccion();
            t.setIdTransaccion(rs.getLong("id_transaccion"));
            t.setNombre(rs.getString("nombre"));
            t.setMontoOriginal(rs.getBigDecimal("monto_original"));
            t.setMonedaOriginal(rs.getString("moneda_original"));
            t.setTasaCambio(rs.getBigDecimal("tasa_cambio"));
            t.setModalidadDivision(rs.getString("modalidad_division"));
            t.setContexto(rs.getString("contexto"));
            t.setIdUsuario(rs.getObject("id_usuario", Long.class));
            t.setIdCirculoGasto(rs.getObject("id_circulo_gasto", Long.class));
            t.setIdCategoria(rs.getObject("id_categoria", Long.class));
            t.setIdGasto(rs.getObject("id_gasto", Long.class));
            t.setIdTipoMovimiento(rs.getObject("id_tipo_movimiento", Long.class));
            t.setTipoCategoria(rs.getString("tipo_categoria"));
            return t;
        }, idUsuario, u, d);

        BigDecimal total = transacciones.stream()
                .map(Transaccion::getMontoOriginal)
                .filter(b -> b != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info("Gastos hormiga detectados para usuario {}: {} transacciones, total {}",
                idUsuario, transacciones.size(), total);

        return new GastosHormigaResponse(idUsuario, u, d,
                transacciones.size(), total, transacciones);
    }
}
