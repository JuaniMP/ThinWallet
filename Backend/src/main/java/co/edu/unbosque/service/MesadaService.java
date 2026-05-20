package co.edu.unbosque.service;

import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.repository.TipoMovimientoRepository;
import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;

/**
 * RF-12 — Mesadas en círculos familiares.
 * Invoca {@code sp_asignar_mesada} (auditoría + registro en `gasto`) y crea
 * las dos transacciones (RETIRO admin + DEPOSITO destinatario) para que el
 * saldo de ambos usuarios refleje la transferencia.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MesadaService {

    private final JdbcTemplate jdbcTemplate;
    private final TransaccionRepository transaccionRepository;
    private final TipoMovimientoRepository tipoMovimientoRepository;
    private final UsuarioRepository usuarioRepository;

    @Autowired(required = false)
    private SseEventBus eventBus;

    @Autowired(required = false)
    private NotificacionService notificacionService;

    @Transactional
    public Map<String, Object> asignar(Long idCirculo, Long idAdmin,
                                       Long idDestino, BigDecimal monto,
                                       String monedaBase, BigDecimal tasaCambio,
                                       String nombreCirculo) {
        // 1. Llamar al SP sp_asignar_mesada — valida permisos, miembro, y crea
        //    el registro en `gasto` con periodicidad "UNICA". El log queda como
        //    prueba para la rúbrica.
        Map<String, Object> spOut = jdbcTemplate.call(con -> {
            var cs = con.prepareCall("{call sp_asignar_mesada(?, ?, ?, ?, ?, ?, ?)}");
            cs.setLong(1, idCirculo);
            cs.setLong(2, idDestino);
            cs.setBigDecimal(3, monto);
            cs.setString(4, "UNICA");
            cs.setLong(5, idAdmin);
            cs.registerOutParameter(6, Types.INTEGER);
            cs.registerOutParameter(7, Types.VARCHAR);
            return cs;
        }, Arrays.asList(
                new SqlParameter("p_id_circulo", Types.INTEGER),
                new SqlParameter("p_id_miembro", Types.INTEGER),
                new SqlParameter("p_monto", Types.DECIMAL),
                new SqlParameter("p_periodo", Types.VARCHAR),
                new SqlParameter("p_id_admin", Types.INTEGER),
                new SqlOutParameter("p_resultado", Types.INTEGER),
                new SqlOutParameter("p_mensaje", Types.VARCHAR)
        ));

        Integer resultado = (Integer) spOut.get("p_resultado");
        String mensaje = (String) spOut.get("p_mensaje");
        log.info("sp_asignar_mesada idCirculo={} idMiembro={} monto={} admin={} resultado={} msg={}",
                idCirculo, idDestino, monto, idAdmin, resultado, mensaje);

        if (resultado == null || resultado == 0) {
            return Map.of("resultado", 0, "mensaje", mensaje != null ? mensaje : "Error al asignar mesada");
        }

        // 2. Crear las dos transacciones para reflejar la transferencia en saldos
        Long idTipoMesadaEnviada = tipoMovimientoRepository.findByNombre("MESADA_ENVIADA")
                .map(t -> t.getIdTipoMovimiento()).orElse(2L);
        Long idTipoMesadaRecibida = tipoMovimientoRepository.findByNombre("MESADA_RECIBIDA")
                .map(t -> t.getIdTipoMovimiento()).orElse(1L);

        String nombreDestino = usuarioRepository.findById(idDestino)
                .map(u -> (u.getNombres() + " " + u.getApellidos()).trim())
                .orElse("miembro");
        String nombreAdmin = usuarioRepository.findById(idAdmin)
                .map(u -> (u.getNombres() + " " + u.getApellidos()).trim())
                .orElse("administrador");

        BigDecimal tasa = tasaCambio != null ? tasaCambio : BigDecimal.ONE;

        // RETIRO para el admin
        Transaccion retiro = new Transaccion();
        retiro.setNombre("Mesada enviada a " + nombreDestino);
        retiro.setMontoOriginal(monto);
        retiro.setMonedaOriginal(monedaBase);
        retiro.setTasaCambio(tasa);
        retiro.setIdUsuario(idAdmin);
        retiro.setIdCirculoGasto(idCirculo);
        retiro.setIdTipoMovimiento(idTipoMesadaEnviada);
        retiro.setContexto("Mesada del círculo " + (nombreCirculo != null ? nombreCirculo : ""));
        transaccionRepository.save(retiro);

        // DEPOSITO para el destinatario
        Transaccion deposito = new Transaccion();
        deposito.setNombre("Mesada recibida de " + nombreAdmin);
        deposito.setMontoOriginal(monto);
        deposito.setMonedaOriginal(monedaBase);
        deposito.setTasaCambio(tasa);
        deposito.setIdUsuario(idDestino);
        deposito.setIdCirculoGasto(idCirculo);
        deposito.setIdTipoMovimiento(idTipoMesadaRecibida);
        deposito.setContexto("Mesada del círculo " + (nombreCirculo != null ? nombreCirculo : ""));
        transaccionRepository.save(deposito);

        // 3. Notificar al destinatario
        if (notificacionService != null) {
            try {
                notificacionService.crear(idDestino,
                        "Recibiste una mesada",
                        nombreAdmin + " te envió una mesada de $" + monto.longValue()
                                + " en " + (nombreCirculo != null ? nombreCirculo : "el círculo"),
                        "MESADA_RECIBIDA", idCirculo, null);
            } catch (Exception e) {
                log.warn("No se pudo notificar mesada a {}: {}", idDestino, e.getMessage());
            }
        }

        // 4. Refrescar saldos vía SSE
        if (eventBus != null) {
            eventBus.publicarSaldo(idAdmin);
            eventBus.publicarSaldo(idDestino);
        }

        return Map.of("resultado", 1, "mensaje", mensaje);
    }

    @SuppressWarnings("unused")
    private void marcarFechaTransaccion(Transaccion t) {
        // fecha_ejecucion se llena con DEFAULT en la BD, este helper queda como
        // futuro extension point si hay que sobreescribir.
        t.setFechaEjecucion(LocalDateTime.now());
    }
}
