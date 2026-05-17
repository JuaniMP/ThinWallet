package co.edu.unbosque.service;

import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.entity.UsuarioGasto;
import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.repository.GastoRepository;
import co.edu.unbosque.repository.UsuarioGastoRepository;
import co.edu.unbosque.repository.UsuarioCirculoRepository;
import co.edu.unbosque.request.GastoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @Autowired(required = false)
    private NotificacionService notificacionService;

    @Autowired(required = false)
    private UsuarioCirculoRepository usuarioCirculoRepository;

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
            boolean yaCumplida = gasto.getMontoActual() != null && gasto.getValor() != null
                    && gasto.getMontoActual().compareTo(gasto.getValor()) >= 0;
            if (request.getMontoActual() != null) {
                gasto.setMontoActual(request.getMontoActual());
            }
            Gasto saved = gastoRepository.save(gasto);

            // Notificar meta cumplida (solo la primera vez que se alcanza)
            boolean ahoraCumplida = "META".equals(saved.getPeriodicidad())
                    && saved.getMontoActual() != null && saved.getValor() != null
                    && saved.getMontoActual().compareTo(saved.getValor()) >= 0;
            if (!yaCumplida && ahoraCumplida && notificacionService != null && saved.getIdUsuarioCreador() != null) {
                try {
                    notificacionService.crear(
                            saved.getIdUsuarioCreador(),
                            "¡Meta cumplida!",
                            "Alcanzaste tu meta \"" + saved.getNombre() + "\" de $" + saved.getValor().longValue(),
                            "META_CUMPLIDA",
                            null,
                            null
                    );
                } catch (Exception e) {
                    log.warn("No se pudo notificar meta cumplida {}: {}", saved.getIdGasto(), e.getMessage());
                }
            }

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
            List<UsuarioGasto> vinculos = usuarioGastoRepository.findByIdGasto(id);
            usuarioGastoRepository.deleteAll(vinculos);
            gastoRepository.deleteById(id);
            if (auditoriaService != null) {
                auditoriaService.registrar(g.getIdUsuarioCreador(), "gasto", id, "DELETE",
                        "{\"nombre\":\"" + g.getNombre() + "\",\"valor\":" + g.getValor() + "}", null);
            }
        });
    }

    // ── Metas grupales por círculo ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Gasto> findMetasGrupalesByCirculo(Long idCirculo) {
        return gastoRepository.findByIdCirculoGasto(idCirculo).stream()
                .filter(g -> "META".equals(g.getPeriodicidad()) || "META_PROPUESTA".equals(g.getPeriodicidad()))
                .map(g -> populateMetaInfo(g, idCirculo))
                .toList();
    }

    @Transactional
    public Gasto proponerMetaGrupal(Long idCirculo, Long idUsuarioCreador, GastoRequest request) {
        Gasto gasto = new Gasto();
        gasto.setNombre(request.getNombre());
        gasto.setValor(request.getValor());
        gasto.setPeriodicidad("META_PROPUESTA");
        gasto.setFechaInicio(LocalDateTime.now());
        gasto.setIdUsuarioCreador(idUsuarioCreador);
        gasto.setIdCirculoGasto(idCirculo);
        gasto.setIdCategoria(request.getIdCategoria() != null ? request.getIdCategoria() : 23L);
        gasto.setMontoActual(BigDecimal.ZERO);
        Gasto saved = gastoRepository.save(gasto);

        // Creador acepta automáticamente
        UsuarioGasto ug = new UsuarioGasto();
        ug.setIdUsuario(idUsuarioCreador);
        ug.setIdGasto(saved.getIdGasto());
        usuarioGastoRepository.save(ug);

        // Notificar a los demás miembros
        if (notificacionService != null && usuarioCirculoRepository != null) {
            usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(idCirculo).stream()
                    .map(uc -> uc.getId().getIdUsuario())
                    .filter(uid -> !uid.equals(idUsuarioCreador))
                    .forEach(uid -> notificacionService.crear(uid,
                            "Meta grupal propuesta",
                            "Se propuso la meta \"" + saved.getNombre() + "\" en tu círculo. Acepta para activarla.",
                            "META_GRUPAL_PROPUESTA", idCirculo, null));
        }

        if (actividadCirculoService != null) {
            actividadCirculoService.registrarEvento(idCirculo, "META_GRUPAL_PROPUESTA", idUsuarioCreador,
                    Map.of("nombre", saved.getNombre(), "valor", saved.getValor()));
        }

        return populateMetaInfo(saved, idCirculo);
    }

    @Transactional
    public Gasto aceptarMetaGrupal(Long idGasto, Long idUsuario) {
        Gasto gasto = gastoRepository.findById(idGasto)
                .orElseThrow(() -> new IllegalArgumentException("META_NO_ENCONTRADA"));

        if (!"META_PROPUESTA".equals(gasto.getPeriodicidad())) {
            throw new IllegalStateException("La meta ya está activa o fue cancelada");
        }

        Long idCirculo = gasto.getIdCirculoGasto();

        // Registrar aceptación si no existe
        boolean yaAcepto = usuarioGastoRepository.findByIdGasto(idGasto).stream()
                .anyMatch(ug -> ug.getIdUsuario().equals(idUsuario));
        if (!yaAcepto) {
            UsuarioGasto ug = new UsuarioGasto();
            ug.setIdUsuario(idUsuario);
            ug.setIdGasto(idGasto);
            usuarioGastoRepository.save(ug);
        }

        long aceptaciones = usuarioGastoRepository.findByIdGasto(idGasto).size();
        long totalMiembros = usuarioCirculoRepository != null
                ? usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(idCirculo).size() : 0;

        if (aceptaciones >= totalMiembros && totalMiembros > 0) {
            gasto.setPeriodicidad("META");
            Gasto activada = gastoRepository.save(gasto);
            if (notificacionService != null && usuarioCirculoRepository != null) {
                usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(idCirculo).stream()
                        .map(uc -> uc.getId().getIdUsuario())
                        .forEach(uid -> notificacionService.crear(uid,
                                "¡Meta grupal activada!",
                                "La meta \"" + gasto.getNombre() + "\" fue aceptada por todos. ¡Empiecen a abonar!",
                                "META_GRUPAL_ACTIVADA", idCirculo, null));
            }
            if (actividadCirculoService != null) {
                actividadCirculoService.registrarEvento(idCirculo, "META_GRUPAL_ACTIVADA", idUsuario,
                        Map.of("nombre", gasto.getNombre(), "valor", gasto.getValor()));
            }
            return populateMetaInfo(activada, idCirculo);
        }

        return populateMetaInfo(gasto, idCirculo);
    }

    @Transactional
    public void rechazarMetaGrupal(Long idGasto, Long idUsuario) {
        Gasto gasto = gastoRepository.findById(idGasto)
                .orElseThrow(() -> new IllegalArgumentException("META_NO_ENCONTRADA"));

        Long idCirculo = gasto.getIdCirculoGasto();
        String nombre = gasto.getNombre();

        usuarioGastoRepository.deleteAll(usuarioGastoRepository.findByIdGasto(idGasto));
        gastoRepository.deleteById(idGasto);

        if (notificacionService != null && usuarioCirculoRepository != null && idCirculo != null) {
            usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(idCirculo).stream()
                    .map(uc -> uc.getId().getIdUsuario())
                    .forEach(uid -> notificacionService.crear(uid,
                            "Meta grupal rechazada",
                            "La meta \"" + nombre + "\" fue rechazada y no se activará.",
                            "META_GRUPAL_RECHAZADA", idCirculo, null));
        }
        if (actividadCirculoService != null && idCirculo != null) {
            actividadCirculoService.registrarEvento(idCirculo, "META_GRUPAL_RECHAZADA", idUsuario,
                    Map.of("nombre", nombre));
        }
    }

    @Transactional
    public Gasto abonarMetaGrupal(Long idGasto, Long idUsuario, BigDecimal monto) {
        Gasto gasto = gastoRepository.findById(idGasto)
                .orElseThrow(() -> new IllegalArgumentException("META_NO_ENCONTRADA"));

        if (!"META".equals(gasto.getPeriodicidad())) {
            throw new IllegalStateException("La meta aún no está activa");
        }

        BigDecimal actual = gasto.getMontoActual() != null ? gasto.getMontoActual() : BigDecimal.ZERO;
        if (actual.compareTo(gasto.getValor()) >= 0) {
            throw new IllegalStateException("La meta ya fue cumplida");
        }
        BigDecimal restante = gasto.getValor().subtract(actual);
        BigDecimal montoFinal = monto.compareTo(restante) > 0 ? restante : monto;
        gasto.setMontoActual(actual.add(montoFinal));
        Gasto saved = gastoRepository.save(gasto);

        if (saved.getMontoActual().compareTo(saved.getValor()) >= 0
                && saved.getIdCirculoGasto() != null) {
            if (notificacionService != null && usuarioCirculoRepository != null) {
                usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(saved.getIdCirculoGasto()).stream()
                        .map(uc -> uc.getId().getIdUsuario())
                        .forEach(uid -> notificacionService.crear(uid,
                                "¡Meta grupal cumplida!",
                                "¡Lograron la meta \"" + saved.getNombre() + "\"! 🎉",
                                "META_GRUPAL_CUMPLIDA", saved.getIdCirculoGasto(), null));
            }
            if (actividadCirculoService != null) {
                actividadCirculoService.registrarEvento(saved.getIdCirculoGasto(), "META_GRUPAL_CUMPLIDA", idUsuario,
                        Map.of("nombre", saved.getNombre(), "valor", saved.getValor()));
            }
        }

        return populateMetaInfo(saved, saved.getIdCirculoGasto());
    }

    private Gasto populateMetaInfo(Gasto gasto, Long idCirculo) {
        List<Long> aceptaciones = usuarioGastoRepository.findByIdGasto(gasto.getIdGasto())
                .stream().map(UsuarioGasto::getIdUsuario).toList();
        gasto.setAceptaciones(aceptaciones);
        if (idCirculo != null && usuarioCirculoRepository != null) {
            gasto.setTotalMiembros(usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(idCirculo).size());
        }
        return gasto;
    }
}