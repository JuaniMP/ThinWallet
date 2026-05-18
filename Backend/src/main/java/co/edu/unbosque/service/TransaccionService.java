package co.edu.unbosque.service;

import co.edu.unbosque.entity.Categoria;
import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.entity.TipoMovimiento;
import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.repository.CategoriaRepository;
import co.edu.unbosque.repository.GastoRepository;
import co.edu.unbosque.repository.TipoMovimientoRepository;
import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.repository.UsuarioCirculoRepository;
import co.edu.unbosque.request.TransaccionRequest;
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
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionRepository transaccionRepository;
    private final TipoMovimientoRepository tipoMovimientoRepository;
    private final CategoriaRepository categoriaRepository;
    private final GastoRepository gastoRepository;
    private final UsuarioCirculoRepository usuarioCirculoRepository;

    @Autowired(required = false)
    private ActividadCirculoService actividadCirculoService;

    @Autowired(required = false)
    private AuditoriaSistemaService auditoriaService;

    @Autowired(required = false)
    private SseEventBus eventBus;

    @Autowired(required = false)
    private NotificacionService notificacionService;

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void populateTipos(List<Transaccion> lista) {
        Map<Long, String> tiposMovimiento = tipoMovimientoRepository.findAll().stream()
                .collect(Collectors.toMap(TipoMovimiento::getIdTipoMovimiento, TipoMovimiento::getNombre));
        Map<Long, String> tiposCategoria = categoriaRepository.findAll().stream()
                .filter(c -> c.getTipoCategoria() != null)
                .collect(Collectors.toMap(Categoria::getIdCategoria, Categoria::getTipoCategoria, (a, b) -> a));
        lista.forEach(t -> {
            if (t.getIdTipoMovimiento() != null) {
                t.setTipoMovimiento(tiposMovimiento.getOrDefault(t.getIdTipoMovimiento(), null));
            }
            if (t.getIdCategoria() != null) {
                t.setTipoCategoria(tiposCategoria.getOrDefault(t.getIdCategoria(), null));
            }
        });
    }

    private void populateTipo(Transaccion t) {
        if (t.getIdTipoMovimiento() != null) {
            tipoMovimientoRepository.findById(t.getIdTipoMovimiento())
                    .ifPresent(tm -> t.setTipoMovimiento(tm.getNombre()));
        }
        if (t.getIdCategoria() != null) {
            categoriaRepository.findById(t.getIdCategoria())
                    .ifPresent(c -> t.setTipoCategoria(c.getTipoCategoria()));
        }
    }

    /** ¿La categoría seleccionada es de tipo RETIRO? */
    private boolean esCategoriaRetiro(Long idCategoria) {
        if (idCategoria == null) return false;
        return categoriaRepository.findById(idCategoria)
                .map(c -> "RETIRO".equalsIgnoreCase(c.getTipoCategoria()))
                .orElse(false);
    }

    /** Si el request trae nombre pero no id, resuelve el id desde la tabla. Nunca retorna null. */
    private Long resolverIdTipoMovimiento(TransaccionRequest request) {
        if (request.getIdTipoMovimiento() != null) return request.getIdTipoMovimiento();
        if (request.getTipoMovimiento() != null) {
            Long resuelto = tipoMovimientoRepository.findByNombre(request.getTipoMovimiento().toUpperCase())
                    .map(TipoMovimiento::getIdTipoMovimiento)
                    .orElse(null);
            if (resuelto != null) return resuelto;
        }
        // Fallback: primer tipo de movimiento disponible en la tabla
        return tipoMovimientoRepository.findAll().stream()
                .findFirst()
                .map(TipoMovimiento::getIdTipoMovimiento)
                .orElse(2L);
    }

    /** Si idCategoria es null, usa la primera categoría disponible. Nunca deja null en BD. */
    private Long resolverIdCategoria(Long idCategoria) {
        if (idCategoria != null) return idCategoria;
        return categoriaRepository.findAll().stream()
                .findFirst()
                .map(Categoria::getIdCategoria)
                .orElse(1L);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Transaccion> findAll() {
        List<Transaccion> lista = transaccionRepository.findAll();
        populateTipos(lista);
        return lista;
    }

    @Transactional(readOnly = true)
    public Optional<Transaccion> findById(Long id) {
        return transaccionRepository.findById(id).map(t -> { populateTipo(t); return t; });
    }

    @Transactional(readOnly = true)
    public List<Transaccion> findByUsuario(Long idUsuario) {
        List<Transaccion> lista = transaccionRepository.findByIdUsuario(idUsuario);
        populateTipos(lista);
        return lista;
    }

    @Transactional(readOnly = true)
    public List<Transaccion> findByCirculoGasto(Long idCirculoGasto) {
        List<Transaccion> lista = transaccionRepository.findByIdCirculoGasto(idCirculoGasto);
        populateTipos(lista);
        return lista;
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    @Transactional
    public Transaccion create(TransaccionRequest request) {
        Long idTipoMovimiento = resolverIdTipoMovimiento(request);

        Long idGasto = request.getIdGasto();
        if (idGasto == null
                && request.getIdCategoria() != null
                && esCategoriaRetiro(request.getIdCategoria())) {
            Gasto gasto = new Gasto();
            gasto.setNombre(request.getNombre());
            gasto.setValor(request.getMontoOriginal());
            gasto.setPeriodicidad("GASTO");
            gasto.setFechaInicio(LocalDateTime.now());
            gasto.setIdUsuarioCreador(request.getIdUsuario());
            gasto.setIdCirculoGasto(request.getIdCirculoGasto());
            gasto.setIdCategoria(request.getIdCategoria());
            Gasto savedGasto = gastoRepository.save(gasto);
            idGasto = savedGasto.getIdGasto();
        }

        Transaccion transaccion = new Transaccion();
        transaccion.setNombre(request.getNombre());
        transaccion.setMontoOriginal(request.getMontoOriginal());
        transaccion.setMonedaOriginal(request.getMonedaOriginal());
        transaccion.setTasaCambio(request.getTasaCambio());
        transaccion.setModalidadDivision(request.getModalidadDivision());
        transaccion.setContexto(request.getContexto());
        transaccion.setIdUsuario(request.getIdUsuario());
        transaccion.setIdCirculoGasto(request.getIdCirculoGasto());
        transaccion.setIdCategoria(resolverIdCategoria(request.getIdCategoria()));
        transaccion.setIdGasto(idGasto);
        transaccion.setIdTipoMovimiento(idTipoMovimiento);
        Transaccion saved = transaccionRepository.save(transaccion);
        populateTipo(saved);

        if (auditoriaService != null) {
            auditoriaService.registrar(saved.getIdUsuario(), "transaccion", saved.getIdTransaccion(),
                    "INSERT", null,
                    "{\"monto\":" + saved.getMontoOriginal() + ",\"tipo\":" + saved.getIdTipoMovimiento() + "}");
        }

        // Auditoría NoSQL: registrar evento en MongoDB
        if (actividadCirculoService != null && saved.getIdCirculoGasto() != null) {
            Map<String, Object> contexto = new HashMap<>();
            contexto.put("monto", saved.getMontoOriginal());
            contexto.put("moneda", saved.getMonedaOriginal());
            contexto.put("modalidad", saved.getModalidadDivision());
            actividadCirculoService.registrarEvento(
                    saved.getIdCirculoGasto(), "TRANSACCION_REALIZADA",
                    saved.getIdUsuario(), contexto);
        }

        if (eventBus != null) eventBus.publicarSaldo(saved.getIdUsuario());

        // Notificar a los demás miembros del círculo
        if (notificacionService != null && saved.getIdCirculoGasto() != null) {
            try {
                usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(saved.getIdCirculoGasto())
                        .stream()
                        .map(uc -> uc.getId().getIdUsuario())
                        .filter(uid -> !uid.equals(saved.getIdUsuario()))
                        .forEach(uid -> notificacionService.crear(
                                uid,
                                "Nuevo gasto en el círculo",
                                "Se registró \"" + saved.getNombre() + "\" por $" + saved.getMontoOriginal().longValue() + " " + saved.getMonedaOriginal(),
                                "GASTO_CIRCULO",
                                saved.getIdCirculoGasto(),
                                null
                        ));
            } catch (Exception e) {
                log.warn("No se pudo notificar gasto en círculo {}: {}", saved.getIdCirculoGasto(), e.getMessage());
            }
        }

        return saved;
    }

    @Transactional
    public Optional<Transaccion> update(Long id, TransaccionRequest request) {
        return transaccionRepository.findById(id).map(transaccion -> {
            String anterior = "{\"monto\":" + transaccion.getMontoOriginal() + ",\"tipo\":" + transaccion.getIdTipoMovimiento() + "}";
            transaccion.setNombre(request.getNombre());
            transaccion.setMontoOriginal(request.getMontoOriginal());
            transaccion.setMonedaOriginal(request.getMonedaOriginal());
            transaccion.setTasaCambio(request.getTasaCambio());
            transaccion.setModalidadDivision(request.getModalidadDivision());
            transaccion.setContexto(request.getContexto());
            transaccion.setIdTipoMovimiento(resolverIdTipoMovimiento(request));
            Transaccion saved = transaccionRepository.save(transaccion);
            populateTipo(saved);
            if (auditoriaService != null) {
                auditoriaService.registrar(saved.getIdUsuario(), "transaccion", saved.getIdTransaccion(),
                        "UPDATE", anterior,
                        "{\"monto\":" + saved.getMontoOriginal() + ",\"tipo\":" + saved.getIdTipoMovimiento() + "}");
            }
            if (eventBus != null) eventBus.publicarSaldo(saved.getIdUsuario());
            return saved;
        });
    }

    @Transactional
    public void delete(Long id) {
        transaccionRepository.findById(id).ifPresent(t -> {
            transaccionRepository.deleteById(id);
            if (auditoriaService != null) {
                auditoriaService.registrar(t.getIdUsuario(), "transaccion", id, "DELETE",
                        "{\"monto\":" + t.getMontoOriginal() + "}", null);
            }
            if (eventBus != null) eventBus.publicarSaldo(t.getIdUsuario());
        });
    }
}
