package co.edu.unbosque.service;

import co.edu.unbosque.dto.CierreCicloResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Types;
import java.util.Arrays;
import java.util.Map;

/**
 * RF-15 — Cierre de ciclo mensual.
 * Invoca el SP {@code sp_cerrar_ciclo_mensual} que valida deudas pendientes
 * y registra el cierre en {@code auditoria_sistema}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CicloService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public CierreCicloResponse cerrarMensual(Long idCirculo, Integer mes, Integer anio) {
        Map<String, Object> out = jdbcTemplate.call(con -> {
            var cs = con.prepareCall("{call sp_cerrar_ciclo_mensual(?, ?, ?, ?, ?)}");
            cs.setLong(1, idCirculo);
            cs.setInt(2, mes);
            cs.setInt(3, anio);
            cs.registerOutParameter(4, Types.INTEGER);
            cs.registerOutParameter(5, Types.VARCHAR);
            return cs;
        }, Arrays.asList(
                new SqlParameter("p_id_circulo", Types.INTEGER),
                new SqlParameter("p_mes", Types.INTEGER),
                new SqlParameter("p_anio", Types.INTEGER),
                new SqlOutParameter("p_resultado", Types.INTEGER),
                new SqlOutParameter("p_mensaje", Types.VARCHAR)
        ));

        Integer resultado = (Integer) out.get("p_resultado");
        String mensaje = (String) out.get("p_mensaje");
        log.info("Cierre ciclo mensual circulo={} mes={} anio={} resultado={} msg={}",
                idCirculo, mes, anio, resultado, mensaje);

        return new CierreCicloResponse(
                resultado != null ? resultado : 0,
                mensaje != null ? mensaje : "Sin mensaje del procedimiento",
                idCirculo, mes, anio);
    }
}
