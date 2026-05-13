package co.edu.unbosque.service;

import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.entity.UsuarioGasto;
import co.edu.unbosque.repository.GastoRepository;
import co.edu.unbosque.repository.UsuarioGastoRepository;
import co.edu.unbosque.request.GastoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class GastoService {

    private final GastoRepository gastoRepository;
    private final UsuarioGastoRepository usuarioGastoRepository;

    @Autowired(required = false)
    private ActividadCirculoService actividadCirculoService;

    @Autowired(required = false)
    private AuditoriaSistemaService auditoriaService;

    @Transactional(readOnly = true)
    public List<Gasto> findAll() {
        return gastoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Gasto> findById(Long id) {
        return gastoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Gasto> findByUsuarioCreador(Long idUsuarioCreador) {
        return gastoRepository.findByIdUsuarioCreador(idUsuarioCreador);
    }

    @Transactional(readOnly = true)
    public List<Gasto> findByCirculoGasto(Long idCirculoGasto) {
        return gastoRepository.findByIdCirculoGasto(idCirculoGasto);
    }

    @Transactional(readOnly = true)
    public List<Gasto> findProgramadosByUsuario(Long idUsuario) {
        return gastoRepository.findByIdUsuarioCreador(idUsuario).stream()
                .filter(g -> g.getPeriodicidad() != null && !g.getPeriodicidad().equals("META"))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Gasto> findMetasByUsuario(Long idUsuario) {
        return gastoRepository.findByIdUsuarioCreador(idUsuario).stream()
                .filter(g -> "META".equals(g.getPeriodicidad()))
                .toList();
    }

    @Transactional
    public Gasto create(GastoRequest request) {
        Gasto gasto = new Gasto();
        gasto.setNombre(request.getNombre());
        gasto.setValor(request.getValor());
        gasto.setPeriodicidad(request.getPeriodicidad());
        gasto.setFechaInicio(request.getFechaInicio());
        gasto.setFechaFin(request.getFechaFin());
        gasto.setIdUsuarioCreador(request.getIdUsuarioCreador());
        gasto.setIdCirculoGasto(request.getIdCirculoGasto());
        gasto.setIdCategoria(request.getIdCategoria());
        Gasto saved = gastoRepository.save(gasto);

        // Vincular creador en usuario_gasto
        if (saved.getIdUsuarioCreador() != null) {
            UsuarioGasto ug = new UsuarioGasto();
            ug.setIdUsuario(saved.getIdUsuarioCreador());
            ug.setIdGasto(saved.getIdGasto());
            usuarioGastoRepository.save(ug);
        }

        if (auditoriaService != null) {
            auditoriaService.registrar(saved.getIdUsuarioCreador(), "gasto", saved.getIdGasto(),
                    "INSERT", null,
                    "{\"nombre\":\"" + saved.getNombre() + "\",\"valor\":" + saved.getValor()
                            + ",\"periodicidad\":\"" + saved.getPeriodicidad() + "\"}");
        }

        // Auditoría NoSQL — en try/catch para que un fallo de Mongo no revienta el guardado SQL
        if (actividadCirculoService != null && saved.getIdCirculoGasto() != null) {
            try {
                Map<String, Object> ctx = new HashMap<>();
                ctx.put("nombre", saved.getNombre());
                ctx.put("valor", saved.getValor());
                ctx.put("periodicidad", saved.getPeriodicidad());
                actividadCirculoService.registrarEvento(
                        saved.getIdCirculoGasto(), "GASTO_PROGRAMADO_CREADO",
                        saved.getIdUsuarioCreador(), ctx);
            } catch (Exception e) {
                log.warn("MongoDB audit fallo para gasto {}: {}", saved.getIdGasto(), e.getMessage());
            }
        }

        return saved;
    }

    @Transactional
    public Optional<Gasto> update(Long id, GastoRequest request) {
        return gastoRepository.findById(id).map(gasto -> {
            String anterior = "{\"nombre\":\"" + gasto.getNombre() + "\",\"valor\":" + gasto.getValor() + "}";
            gasto.setNombre(request.getNombre());
            gasto.setValor(request.getValor());
            gasto.setPeriodicidad(request.getPeriodicidad());
            gasto.setFechaInicio(request.getFechaInicio());
            gasto.setFechaFin(request.getFechaFin());
            gasto.setIdCategoria(request.getIdCategoria());
            Gasto saved = gastoRepository.save(gasto);
            if (auditoriaService != null) {
                auditoriaService.registrar(saved.getIdUsuarioCreador(), "gasto", saved.getIdGasto(),
                        "UPDATE", anterior,
                        "{\"nombre\":\"" + saved.getNombre() + "\",\"valor\":" + saved.getValor() + "}");
            }
            return saved;
        });
    }

    @Transactional
    public void delete(Long id) {
        gastoRepository.findById(id).ifPresent(g -> {
            // Eliminar vínculos en usuario_gasto antes de borrar el gasto
            List<UsuarioGasto> vinculos = usuarioGastoRepository.findByIdGasto(id);
            usuarioGastoRepository.deleteAll(vinculos);
            gastoRepository.deleteById(id);
            if (auditoriaService != null) {
                auditoriaService.registrar(g.getIdUsuarioCreador(), "gasto", id, "DELETE",
                        "{\"nombre\":\"" + g.getNombre() + "\",\"valor\":" + g.getValor() + "}", null);
            }
        });
    }
}