package co.edu.unbosque.service;

import co.edu.unbosque.entity.Deuda;
import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.repository.DeudaRepository;
import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.request.DeudaRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    @Autowired(required = false)
    private ActividadCirculoService actividadCirculoService;

    @Autowired(required = false)
    private AuditoriaSistemaService auditoriaService;

    @Autowired(required = false)
    private SseEventBus eventBus;

    private void publicarSaldos(Long... usuarios) {
        if (eventBus == null) return;
        for (Long u : usuarios) {
            if (u != null) eventBus.publicarSaldo(u);
        }
    }

    @Transactional(readOnly = true)
    public List<Deuda> findAll() {
        return deudaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Deuda> findById(Long id) {
        return deudaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByUsuarioDeudor(Long idUsuarioDeudor) {
        return deudaRepository.findByDeudor(idUsuarioDeudor);
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByUsuarioAcreedor(Long idUsuarioAcreedor) {
        return deudaRepository.findByAcreedor(idUsuarioAcreedor);
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByTransaccion(Long idTransaccion) {
        return deudaRepository.findByIdTransaccion(idTransaccion);
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

    @Transactional
    public Optional<Deuda> confirmarPago(Long id) {
        return deudaRepository.findById(id).map(deuda -> {
            deuda.setEstadoPago("CONFIRMADO");
            deuda.setFechaConfirmada(LocalDateTime.now());
            Deuda saved = deudaRepository.save(deuda);

            if (auditoriaService != null) {
                auditoriaService.registrar(saved.getIdUsuarioDeudor(), "deuda", saved.getIdDeuda(),
                        "CONFIRMAR_PAGO", "{\"estado\":\"PENDIENTE\"}",
                        "{\"estado\":\"CONFIRMADO\",\"monto\":" + saved.getMonto() + "}");
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

            publicarSaldos(saved.getIdUsuarioDeudor(), saved.getIdUsuarioAcreedor());
            return saved;
        });
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