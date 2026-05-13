package co.edu.unbosque.service;

import co.edu.unbosque.entity.Categoria;
import co.edu.unbosque.entity.TipoMovimiento;
import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.repository.CategoriaRepository;
import co.edu.unbosque.repository.TipoMovimientoRepository;
import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.request.TransaccionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Autowired(required = false)
    private ActividadCirculoService actividadCirculoService;

    @Autowired(required = false)
    private AuditoriaSistemaService auditoriaService;

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

    /** Si el request trae nombre pero no id, resuelve el id desde la tabla. */
    private Long resolverIdTipoMovimiento(TransaccionRequest request) {
        if (request.getIdTipoMovimiento() != null) return request.getIdTipoMovimiento();
        if (request.getTipoMovimiento() != null) {
            return tipoMovimientoRepository.findByNombre(request.getTipoMovimiento().toUpperCase())
                    .map(TipoMovimiento::getIdTipoMovimiento)
                    .orElse(null);
        }
        return null;
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
        Transaccion transaccion = new Transaccion();
        transaccion.setNombre(request.getNombre());
        transaccion.setMontoOriginal(request.getMontoOriginal());
        transaccion.setMonedaOriginal(request.getMonedaOriginal());
        transaccion.setTasaCambio(request.getTasaCambio());
        transaccion.setModalidadDivision(request.getModalidadDivision());
        transaccion.setContexto(request.getContexto());
        transaccion.setIdUsuario(request.getIdUsuario());
        transaccion.setIdCirculoGasto(request.getIdCirculoGasto());
        transaccion.setIdCategoria(request.getIdCategoria());
        transaccion.setIdGasto(request.getIdGasto());
        transaccion.setIdTipoMovimiento(resolverIdTipoMovimiento(request));
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
        });
    }
}
