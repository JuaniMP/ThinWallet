package co.edu.unbosque.service;

import co.edu.unbosque.entity.Deuda;
import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.repository.DeudaRepository;
import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.request.DeudaRequest;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeudaService {

    private final DeudaRepository deudaRepository;
    private final TransaccionRepository transaccionRepository;
    private final JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private ActividadCirculoService actividadCirculoService;

    @Autowired(required = false)
    private AuditoriaSistemaService auditoriaService;

    @Autowired(required = false)
    private SseEventBus eventBus;

    @Autowired(required = false)
    private NotificacionService notificacionService;

    private void populateMoneda(Deuda deuda) {
        if (deuda.getIdTransaccion() != null) {
            transaccionRepository.findById(deuda.getIdTransaccion())
                    .ifPresent(t -> deuda.setMoneda(t.getMonedaOriginal()));
        }
    }

    private void publicarSaldos(Long... usuarios) {
        if (eventBus == null) return;
        for (Long u : usuarios) {
            if (u != null) eventBus.publicarSaldo(u);
        }
    }

    @Transactional(readOnly = true)
    public List<Deuda> findAll() {
        List<Deuda> list = deudaRepository.findAll();
        list.forEach(this::populateMoneda);
        return list;
    }

    @Transactional(readOnly = true)
    public Optional<Deuda> findById(Long id) {
        return deudaRepository.findById(id).map(d -> { populateMoneda(d); return d; });
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByUsuarioDeudor(Long idUsuarioDeudor) {
        List<Deuda> list = deudaRepository.findByDeudor(idUsuarioDeudor);
        list.forEach(this::populateMoneda);
        return list;
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByUsuarioAcreedor(Long idUsuarioAcreedor) {
        List<Deuda> list = deudaRepository.findByAcreedor(idUsuarioAcreedor);
        list.forEach(this::populateMoneda);
        return list;
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByTransaccion(Long idTransaccion) {
        List<Deuda> list = deudaRepository.findByIdTransaccion(idTransaccion);
        list.forEach(this::populateMoneda);
        return list;
    }

    @Transactional
    public Deuda create(DeudaRequest request) {
        if (request.getIdUsuarioDeudor() != null
                && request.getIdUsuarioDeudor().equals(request.getIdUsuarioAcreedor())) {
            throw new IllegalArgumentException("El deudor y el acreedor no pueden ser el mismo usuario");
        }
        Deuda deuda = new Deuda();
        deuda.setMonto(request.getMonto());
        deuda.setMetodoPagoSugerido(request.getMetodoPagoSugerido());
        deuda.setPorcentajeDivision(request.getPorcentajeDivision());
        deuda.setEstadoPago(request.getEstadoPago() != null ? request.getEstadoPago() : "PENDIENTE");
        deuda.setIdTransaccion(request.getIdTransaccion());
        deuda.setIdUsuarioDeudor(request.getIdUsuarioDeudor());
        deuda.setIdUsuarioAcreedor(request.getIdUsuarioAcreedor());
        deuda.setFechaCreacion(LocalDateTime.now());
        Deuda saved = deudaRepository.save(deuda);

        if (auditoriaService != null) {
            auditoriaService.registrar(saved.getIdUsuarioDeudor(), "deuda", saved.getIdDeuda(),
                    "INSERT", null,
                    "{\"monto\":" + saved.getMonto() + ",\"estado\":\"" + saved.getEstadoPago() + "\"}");
        }

        // Auditoría NoSQL
        if (actividadCirculoService != null) {
            Long idCirculo = resolverCirculoDeTransaccion(saved.getIdTransaccion());
            if (idCirculo != null) {
                Map<String, Object> ctx = new HashMap<>();
                ctx.put("monto", saved.getMonto());
                ctx.put("acreedor", saved.getIdUsuarioAcreedor());
                ctx.put("deudor", saved.getIdUsuarioDeudor());
                actividadCirculoService.registrarEvento(idCirculo, "DEUDA_GENERADA",
                        saved.getIdUsuarioAcreedor(), ctx);
            }
        }

        // Notificar al acreedor que alguien registró una deuda con él
        if (notificacionService != null && saved.getIdUsuarioAcreedor() != null) {
            try {
                notificacionService.crear(
                        saved.getIdUsuarioAcreedor(),
                        "Te registraron una deuda",
                        "Alguien indicó que te debe $" + saved.getMonto().longValue(),
                        "DEUDA_ASIGNADA",
                        null,
                        null
                );
            } catch (Exception e) {
                log.warn("No se pudo notificar deuda al acreedor {}: {}", saved.getIdUsuarioAcreedor(), e.getMessage());
            }
        }

        publicarSaldos(saved.getIdUsuarioDeudor(), saved.getIdUsuarioAcreedor());
        return saved;
    }

    @Transactional
    public Optional<Deuda> update(Long id, DeudaRequest request) {
        return deudaRepository.findById(id).map(deuda -> {
            deuda.setMonto(request.getMonto());
            deuda.setMetodoPagoSugerido(request.getMetodoPagoSugerido());
            deuda.setPorcentajeDivision(request.getPorcentajeDivision());
            deuda.setEstadoPago(request.getEstadoPago());
            return deudaRepository.save(deuda);
        });
    }

    /**
     * RQ-08 — Paso 1: el deudor registra que pagó.
     * Invoca {@code sp_pagar_deuda}: PENDIENTE → CONFIRMADA_PENDIENTE.
     */
    @Transactional
    public Map<String, Object> pagarDeuda(Long idDeuda, String metodoPago) {
        Map<String, Object> out = jdbcTemplate.call(con -> {
            var cs = con.prepareCall("{call sp_pagar_deuda(?, ?, ?, ?)}");
            cs.setLong(1, idDeuda);
            cs.setString(2, metodoPago != null ? metodoPago : "TRANSFERENCIA");
            cs.registerOutParameter(3, Types.INTEGER);
            cs.registerOutParameter(4, Types.VARCHAR);
            return cs;
        }, Arrays.asList(
                new SqlParameter("p_id_deuda", Types.INTEGER),
                new SqlParameter("p_metodo_pago", Types.VARCHAR),
                new SqlOutParameter("p_resultado", Types.INTEGER),
                new SqlOutParameter("p_mensaje", Types.VARCHAR)
        ));

        Integer resultado = (Integer) out.get("p_resultado");
        String mensaje = (String) out.get("p_mensaje");
        log.info("sp_pagar_deuda idDeuda={} resultado={} msg={}", idDeuda, resultado, mensaje);

        if (resultado == null || resultado == 0) {
            throw new IllegalStateException(mensaje != null ? mensaje : "Error al procesar pago");
        }

        deudaRepository.findById(idDeuda).ifPresent(deuda -> {
            publicarSaldos(deuda.getIdUsuarioDeudor(), deuda.getIdUsuarioAcreedor());
            if (actividadCirculoService != null) {
                Long idCirculo = resolverCirculoDeTransaccion(deuda.getIdTransaccion());
                if (idCirculo != null) {
                    Map<String, Object> ctx = new HashMap<>();
                    ctx.put("monto", deuda.getMonto());
                    ctx.put("metodo_pago", metodoPago);
                    actividadCirculoService.registrarEvento(idCirculo, "DEUDA_PAGADA",
                            deuda.getIdUsuarioDeudor(), ctx);
                }
            }
        });

        return Map.of("resultado", resultado, "mensaje", mensaje != null ? mensaje : "");
    }

    /**
     * RQ-08 — Paso 2: el acreedor confirma recepción del pago.
     * Invoca {@code sp_confirmar_pago_deuda}: CONFIRMADA_PENDIENTE → PAGADA.
     * Si la deuda está en PENDIENTE, primero la transiciona via sp_pagar_deuda.
     */
    @Transactional
    public Optional<Deuda> confirmarPago(Long id, Long idTransaccion) {
        // Auto-transición: si está PENDIENTE, primero ejecutar sp_pagar_deuda
        deudaRepository.findById(id).ifPresent(d -> {
            if ("PENDIENTE".equals(d.getEstadoPago())) {
                try {
                    pagarDeuda(id, d.getMetodoPagoSugerido() != null ? d.getMetodoPagoSugerido() : "TRANSFERENCIA");
                } catch (Exception e) {
                    log.warn("Auto-pago previo a confirmar fallido para deuda {}: {}", id, e.getMessage());
                }
            }
        });

        Map<String, Object> out = jdbcTemplate.call(con -> {
            var cs = con.prepareCall("{call sp_confirmar_pago_deuda(?, ?, ?)}");
            cs.setLong(1, id);
            cs.registerOutParameter(2, Types.INTEGER);
            cs.registerOutParameter(3, Types.VARCHAR);
            return cs;
        }, Arrays.asList(
                new SqlParameter("p_id_deuda", Types.INTEGER),
                new SqlOutParameter("p_resultado", Types.INTEGER),
                new SqlOutParameter("p_mensaje", Types.VARCHAR)
        ));

        Integer resultado = (Integer) out.get("p_resultado");
        String mensaje = (String) out.get("p_mensaje");
        log.info("sp_confirmar_pago_deuda idDeuda={} resultado={} msg={}", id, resultado, mensaje);

        if (resultado == null || resultado == 0) {
            throw new IllegalStateException(mensaje != null ? mensaje : "Error al confirmar pago");
        }

        return deudaRepository.findById(id).map(saved -> {
            if (idTransaccion != null) saved.setIdTransaccion(idTransaccion);

            if (auditoriaService != null) {
                auditoriaService.registrar(saved.getIdUsuarioDeudor(), "deuda", saved.getIdDeuda(),
                        "CONFIRMAR_PAGO", "{\"estado\":\"CONFIRMADA_PENDIENTE\"}",
                        "{\"estado\":\"PAGADA\",\"monto\":" + saved.getMonto() + "}");
            }

            if (actividadCirculoService != null) {
                Long idCirculo = resolverCirculoDeTransaccion(saved.getIdTransaccion());
                if (idCirculo != null) {
                    Map<String, Object> ctx = new HashMap<>();
                    ctx.put("monto", saved.getMonto());
                    ctx.put("metodo_pago", saved.getMetodoPagoSugerido());
                    actividadCirculoService.registrarEvento(idCirculo, "DEUDA_PAGADA",
                            saved.getIdUsuarioDeudor(), ctx);
                }
            }

            if (notificacionService != null && saved.getIdUsuarioAcreedor() != null) {
                try {
                    notificacionService.crear(
                            saved.getIdUsuarioAcreedor(),
                            "Tu deuda fue pagada",
                            "Se confirmó el pago de $" + saved.getMonto().longValue(),
                            "DEUDA_PAGADA", null, null);
                } catch (Exception e) {
                    log.warn("No se pudo notificar pago al acreedor {}: {}", saved.getIdUsuarioAcreedor(), e.getMessage());
                }
            }

            publicarSaldos(saved.getIdUsuarioDeudor(), saved.getIdUsuarioAcreedor());
            return saved;
        });
    }

    /**
     * RQ-07 — Balance de deudas pendientes de un usuario en un círculo.
     * Invoca {@code fn_calcular_deuda_usuario}.
     */
    @Transactional(readOnly = true)
    public BigDecimal calcularDeudaUsuario(Long idUsuario, Long idCirculo) {
        BigDecimal deuda = jdbcTemplate.queryForObject(
                "SELECT fn_calcular_deuda_usuario(?, ?)",
                BigDecimal.class, idUsuario, idCirculo);
        return deuda != null ? deuda : BigDecimal.ZERO;
    }

    @Transactional
    public Optional<Deuda> rechazarPago(Long id, String motivo) {
        return deudaRepository.findById(id).map(deuda -> {
            if ("CONFIRMADO".equals(deuda.getEstadoPago())) {
                throw new IllegalStateException("No se puede rechazar una deuda ya confirmada");
            }
            deuda.setEstadoPago("RECHAZADO");
            Deuda saved = deudaRepository.save(deuda);

            if (auditoriaService != null) {
                auditoriaService.registrar(saved.getIdUsuarioDeudor(), "deuda", saved.getIdDeuda(),
                        "RECHAZAR_PAGO", "{\"estado\":\"PENDIENTE\"}",
                        "{\"estado\":\"RECHAZADO\",\"motivo\":\"" + (motivo != null ? motivo : "") + "\"}");
            }

            if (actividadCirculoService != null) {
                Long idCirculo = resolverCirculoDeTransaccion(saved.getIdTransaccion());
                if (idCirculo != null) {
                    Map<String, Object> ctx = new HashMap<>();
                    ctx.put("monto", saved.getMonto());
                    ctx.put("motivo", motivo != null ? motivo : "Sin motivo especificado");
                    actividadCirculoService.registrarEvento(idCirculo, "DEUDA_RECHAZADA",
                            saved.getIdUsuarioDeudor(), ctx);
                }
            }

            publicarSaldos(saved.getIdUsuarioDeudor(), saved.getIdUsuarioAcreedor());
            return saved;
        });
    }

    @Transactional
    public void delete(Long id) {
        deudaRepository.findById(id).ifPresent(d -> {
            deudaRepository.deleteById(id);
            if (auditoriaService != null) {
                auditoriaService.registrar(d.getIdUsuarioDeudor(), "deuda", id, "DELETE",
                        "{\"monto\":" + d.getMonto() + ",\"estado\":\"" + d.getEstadoPago() + "\"}", null);
            }
            publicarSaldos(d.getIdUsuarioDeudor(), d.getIdUsuarioAcreedor());
        });
    }

    private Long resolverCirculoDeTransaccion(Long idTransaccion) {
        if (idTransaccion == null) return null;
        return transaccionRepository.findById(idTransaccion)
                .map(Transaccion::getIdCirculoGasto)
                .orElse(null);
    }
}