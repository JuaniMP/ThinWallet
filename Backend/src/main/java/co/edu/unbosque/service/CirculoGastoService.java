package co.edu.unbosque.service;

import co.edu.unbosque.dto.CirculoDetalleResponse;
import co.edu.unbosque.dto.CirculoInvitadoDetalleResponse;
import co.edu.unbosque.entity.CirculoGasto;
import co.edu.unbosque.entity.TipoCirculo;
import co.edu.unbosque.entity.TipoUsuario;
import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.entity.UsuarioCirculoId;
import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.repository.CirculoGastoRepository;
import co.edu.unbosque.repository.GastoRepository;
import co.edu.unbosque.repository.TipoCirculoRepository;
import co.edu.unbosque.repository.TipoUsuarioRepository;
import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.repository.UsuarioCirculoRepository;
import co.edu.unbosque.repository.UsuarioRepository;
import co.edu.unbosque.request.CirculoGastoRequest;
import co.edu.unbosque.request.UsuarioCirculoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CirculoGastoService {

    private final CirculoGastoRepository circuloGastoRepository;
    private final UsuarioCirculoRepository usuarioCirculoRepository;
    private final UsuarioCirculoService usuarioCirculoService;
    private final TipoCirculoRepository tipoCirculoRepository;
    private final TipoUsuarioRepository tipoUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final GastoRepository gastoRepository;
    private final TransaccionRepository transaccionRepository;
    private final TokenHashingService tokenHashingService;

    @Autowired(required = false)
    private NotificacionService notificacionService;

    @Autowired(required = false)
    private ActividadCirculoService actividadCirculoService;

    @Autowired(required = false)
    private AuditoriaSistemaService auditoriaService;

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void populateTipos(List<CirculoGasto> lista) {
        Map<Long, String> tipos = tipoCirculoRepository.findAll().stream()
                .collect(Collectors.toMap(TipoCirculo::getIdTipoCirculo, TipoCirculo::getNombre));
        lista.forEach(c -> {
            if (c.getIdTipoCirculo() != null) {
                c.setTipoCirculo(tipos.getOrDefault(c.getIdTipoCirculo(), "PERSONAL"));
            }
            // Poblar nombres de miembros (excluyendo al creador)
            List<UsuarioCirculo> vinculaciones = usuarioCirculoRepository
                    .findByCirculoGasto_IdCirculoGasto(c.getIdCirculoGasto());
            List<String> nombres = vinculaciones.stream()
                    .filter(uc -> !uc.getId().getIdUsuario().equals(c.getIdUsuarioCreador()))
                    .map(uc -> uc.getUsuario() != null
                            ? (uc.getUsuario().getNombres() + " " + uc.getUsuario().getApellidos()).trim()
                            : "Invitado")
                    .collect(Collectors.toList());
            c.setNombresInvitados(nombres);
        });
    }

    private void populateTipo(CirculoGasto c) {
        if (c.getIdTipoCirculo() != null) {
            tipoCirculoRepository.findById(c.getIdTipoCirculo())
                    .ifPresent(t -> c.setTipoCirculo(t.getNombre()));
        }
    }

    private Long resolverIdTipoCirculo(CirculoGastoRequest request) {
        if (request.getIdTipoCirculo() != null) {
            return request.getIdTipoCirculo();
        }
        if (request.getTipoCirculo() != null && !request.getTipoCirculo().isBlank()) {
            return tipoCirculoRepository.findByNombre(request.getTipoCirculo())
                    .map(TipoCirculo::getIdTipoCirculo)
                    .orElse(null);
        }
        return null;
    }

    private String resolverNombreTipoUsuario(Usuario usuario) {
        if (usuario.getTipoUsuario() == null) {
            return null;
        }
        return usuario.getTipoUsuario().getNombre();
    }

    private CirculoDetalleResponse mapearDetalle(CirculoGasto circulo) {
        List<UsuarioCirculo> vinculaciones = usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(circulo.getIdCirculoGasto());

        List<CirculoInvitadoDetalleResponse> invitados = vinculaciones.stream()
                .filter(uc -> !uc.getId().getIdUsuario().equals(circulo.getIdUsuarioCreador()))
                .map(uc -> {
                    CirculoInvitadoDetalleResponse m = new CirculoInvitadoDetalleResponse();
                    m.setIdUsuario(uc.getId().getIdUsuario());
                    m.setRolUsuario(uc.getRolUsuario());
                    if (uc.getUsuario() != null) {
                        Usuario u = uc.getUsuario();
                        m.setNombreCompleto((u.getNombres() + " " + u.getApellidos()).trim());
                        m.setCorreo(u.getCorreo());
                        String tipoNombre = resolverNombreTipoUsuario(u);
                        m.setTipoUsuario(tipoNombre != null ? tipoNombre : "REGISTRADO");
                        // Si es fantasma y no tiene token, generar y persistir uno
                        if ("FANTASMA".equalsIgnoreCase(m.getTipoUsuario()) && u.getTokenReclamo() == null) {
                            String nuevoToken = tokenHashingService.generateToken();
                            u.setTokenReclamo(nuevoToken);
                            usuarioRepository.save(u);
                        }
                        m.setTokenInvitacionPersonal(u.getTokenReclamo());
                    }
                    return m;
                }).collect(Collectors.toList());

        CirculoDetalleResponse detalle = new CirculoDetalleResponse();
        detalle.setIdCirculoGasto(circulo.getIdCirculoGasto());
        detalle.setNombre(circulo.getNombre());
        detalle.setTipoCirculo(circulo.getTipoCirculo());
        detalle.setMonedaBase(circulo.getMonedaBase());
        detalle.setTokenInvitacion(circulo.getTokenInvitacion());
        detalle.setPresupuestoGrupal(circulo.getPresupuestoGrupal());
        detalle.setPermiteMesadas(circulo.getPermiteMesadas());
        detalle.setPermiteSimplificacionDeudas(circulo.getPermiteSimplificacionDeudas());
        detalle.setIdUsuarioCreador(circulo.getIdUsuarioCreador());
        if (circulo.getIdUsuarioCreador() != null) {
            usuarioRepository.findById(circulo.getIdUsuarioCreador()).ifPresent(creador -> {
                detalle.setNombreCreador((creador.getNombres() + " " + creador.getApellidos()).trim());
                detalle.setCorreoCreador(creador.getCorreo());
            });
        }
        detalle.setFechaCreacion(circulo.getFechaCreacion());
        detalle.setEstado(circulo.getEstado());
        detalle.setTotalMiembros(vinculaciones.size());
        detalle.setTotalInvitados(invitados.size());
        detalle.setInvitados(invitados);
        return detalle;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CirculoGasto> findAll() {
        List<CirculoGasto> lista = circuloGastoRepository.findAll();
        populateTipos(lista);
        return lista;
    }

    @Transactional(readOnly = true)
    public Optional<CirculoGasto> findById(Long id) {
        return circuloGastoRepository.findById(id).map(c -> { populateTipo(c); return c; });
    }

    @Transactional
    public Optional<CirculoDetalleResponse> findDetalleById(Long id) {
        return circuloGastoRepository.findById(id)
                .map(c -> { populateTipo(c); return c; })
                .map(this::mapearDetalle);
    }

    /**
     * Busca un círculo validando el token presentado contra el hash almacenado.
     * Necesario porque el token se guarda hasheado en BD.
     */
    @Transactional(readOnly = true)
    public Optional<CirculoGasto> findByTokenInvitacion(String tokenPresentado) {
        List<CirculoGasto> todos = circuloGastoRepository.findAll();
        for (CirculoGasto c : todos) {
            if (c.getTokenInvitacion() != null &&
                    tokenHashingService.validateToken(tokenPresentado, c.getTokenInvitacion())) {
                populateTipo(c);
                return Optional.of(c);
            }
        }
        return Optional.empty();
    }

    @Transactional(readOnly = true)
    public List<CirculoGasto> findByUsuarioCreador(Long idUsuarioCreador) {
        List<CirculoGasto> lista = circuloGastoRepository.findByIdUsuarioCreador(idUsuarioCreador);
        populateTipos(lista);
        return lista;
    }

    /** Devuelve todos los círculos donde el usuario es creador O miembro. */
    @Transactional(readOnly = true)
    public List<CirculoGasto> findAllByMiembro(Long idUsuario) {
        List<CirculoGasto> creados = circuloGastoRepository.findByIdUsuarioCreador(idUsuario);

        List<Long> idsComoMiembro = usuarioCirculoRepository.findByUsuario_IdUsuario(idUsuario)
                .stream()
                .map(uc -> uc.getId().getIdCirculoGasto())
                .collect(Collectors.toList());

        List<CirculoGasto> unidos = idsComoMiembro.isEmpty()
                ? new ArrayList<>()
                : circuloGastoRepository.findAllById(idsComoMiembro);

        List<CirculoGasto> todos = new ArrayList<>(creados);
        for (CirculoGasto c : unidos) {
            if (todos.stream().noneMatch(x -> x.getIdCirculoGasto().equals(c.getIdCirculoGasto()))) {
                todos.add(c);
            }
        }

        populateTipos(todos);
        return todos;
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    @Transactional
    public CirculoGasto create(CirculoGastoRequest request) {
        log.info("Creando nuevo círculo de gasto: {}", request.getNombre());

        CirculoGasto circulo = new CirculoGasto();
        circulo.setNombre(request.getNombre());
        circulo.setMonedaBase(request.getMonedaBase() != null ? request.getMonedaBase() : "COP");
        circulo.setIdTipoCirculo(resolverIdTipoCirculo(request));
        circulo.setPresupuestoGrupal(request.getPresupuestoGrupal());
        circulo.setPermiteMesadas(request.getPermiteMesadas() != null ? request.getPermiteMesadas() : false);
        circulo.setPermiteSimplificacionDeudas(request.getPermiteSimplificacionDeudas() != null ? request.getPermiteSimplificacionDeudas() : false);
        circulo.setIdUsuarioCreador(request.getIdUsuarioCreador());
        circulo.setFechaCreacion(LocalDateTime.now());
        circulo.setEstado("ACTIVO");

        String tokenOriginal = (request.getTokenInvitacion() != null && !request.getTokenInvitacion().isBlank())
                ? request.getTokenInvitacion()
                : tokenHashingService.generateToken();

        circulo.setTokenInvitacion(tokenHashingService.hashToken(tokenOriginal));
        circulo.setTokenInvitacionOriginal(tokenOriginal);

        CirculoGasto saved = circuloGastoRepository.save(circulo);

        if (request.getIdUsuarioCreador() != null) {
            UsuarioCirculoRequest ucReq = new UsuarioCirculoRequest();
            ucReq.setIdUsuario(request.getIdUsuarioCreador());
            ucReq.setIdCirculoGasto(saved.getIdCirculoGasto());
            ucReq.setRolUsuario("ADMIN");
            usuarioCirculoService.create(ucReq);
        }

        if (request.getNombresInvitados() != null) {
            crearInvitadosYVincular(request.getNombresInvitados(), saved);
        }

        if (auditoriaService != null) {
            auditoriaService.registrar(saved.getIdUsuarioCreador(), "circulo_gasto", saved.getIdCirculoGasto(),
                    "INSERT", null,
                    "{\"nombre\":\"" + saved.getNombre() + "\",\"moneda\":\"" + saved.getMonedaBase() + "\"}");
        }

        if (actividadCirculoService != null) {
            try {
                actividadCirculoService.registrarEvento(
                        saved.getIdCirculoGasto(), "CIRCULO_CREADO",
                        saved.getIdUsuarioCreador(),
                        Map.of("nombre", saved.getNombre(), "moneda", saved.getMonedaBase()));
            } catch (Exception e) {
                log.warn("MongoDB audit fallo para CIRCULO_CREADO {}: {}", saved.getIdCirculoGasto(), e.getMessage());
            }
        }

        populateTipo(saved);
        return saved;
    }

    private void crearInvitadosYVincular(List<String> nombres, CirculoGasto circulo) {
        TipoUsuario tipoFantasma = tipoUsuarioRepository.findByNombre("FANTASMA")
                .orElseGet(() -> tipoUsuarioRepository.findById(3L)
                        .orElseThrow(() -> new RuntimeException("Tipo de usuario FANTASMA no encontrado")));

        for (String nombre : nombres) {
            if (nombre == null || nombre.isBlank()) continue;

            String[] partes = nombre.trim().split("\\s+", 2);
            String tokenReclamo = tokenHashingService.generateToken();
            String sufijo = UUID.randomUUID().toString().substring(0, 6);

            Usuario invitado = new Usuario();
            invitado.setNombres(partes[0]);
            invitado.setApellidos(partes.length > 1 ? partes[1] : partes[0]);
            invitado.setNombreUsuario("ghost_" + sufijo);
            invitado.setCorreo("ghost_" + tokenReclamo + "@thinwallet.local");
            invitado.setContrasenaHash(tokenHashingService.hashToken(tokenHashingService.generateToken()));
            invitado.setTokenReclamo(tokenReclamo);
            invitado.setTipoUsuario(tipoFantasma);
            invitado.setEstado(0);
            invitado.setFechaRegistro(LocalDateTime.now());

            Usuario guardado = usuarioRepository.save(invitado);

            UsuarioCirculoRequest ucReq = new UsuarioCirculoRequest();
            ucReq.setIdUsuario(guardado.getIdUsuario());
            ucReq.setIdCirculoGasto(circulo.getIdCirculoGasto());
            ucReq.setRolUsuario("INVITADO");
            usuarioCirculoService.create(ucReq);

            log.info("Invitado '{}' creado y vinculado al círculo {}", nombre, circulo.getIdCirculoGasto());
        }
    }

    @Transactional
    public Optional<CirculoGasto> update(Long id, CirculoGastoRequest request) {
        return circuloGastoRepository.findById(id).map(circulo -> {
            circulo.setNombre(request.getNombre());
            if (request.getMonedaBase() != null) circulo.setMonedaBase(request.getMonedaBase());
            Long nuevoTipo = resolverIdTipoCirculo(request);
            if (nuevoTipo != null) circulo.setIdTipoCirculo(nuevoTipo);
            if (request.getPresupuestoGrupal() != null) circulo.setPresupuestoGrupal(request.getPresupuestoGrupal());
            if (request.getPermiteMesadas() != null) circulo.setPermiteMesadas(request.getPermiteMesadas());
            if (request.getPermiteSimplificacionDeudas() != null) circulo.setPermiteSimplificacionDeudas(request.getPermiteSimplificacionDeudas());
            CirculoGasto saved = circuloGastoRepository.save(circulo);
            populateTipo(saved);
            return saved;
        });
    }

    @Transactional
    public CirculoDetalleResponse invitarUsuarioRegistrado(Long idCirculo, Long idUsuario) {
        CirculoGasto circulo = circuloGastoRepository.findById(idCirculo)
                .orElseThrow(() -> new IllegalArgumentException("CIRCULO_NO_ENCONTRADO"));

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("USUARIO_NO_ENCONTRADO"));

        String tipoNombre = resolverNombreTipoUsuario(usuario);
        if (usuario.getEstado() != 1 || "FANTASMA".equals(tipoNombre)) {
            throw new IllegalStateException("USUARIO_NO_VALIDO");
        }

        List<UsuarioCirculo> miembros = usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(idCirculo);
        boolean yaMiembro = miembros.stream().anyMatch(m -> m.getId().getIdUsuario().equals(idUsuario));
        if (yaMiembro) {
            throw new IllegalStateException("YA_ES_MIEMBRO");
        }

        UsuarioCirculoRequest ucReq = new UsuarioCirculoRequest();
        ucReq.setIdUsuario(idUsuario);
        ucReq.setIdCirculoGasto(idCirculo);
        ucReq.setRolUsuario("MIEMBRO");
        usuarioCirculoService.create(ucReq);

        if (notificacionService != null) {
            try {
                notificacionService.crear(
                        idUsuario,
                        "Te invitaron a un círculo",
                        "Fuiste invitado al círculo \"" + circulo.getNombre() + "\"",
                        "INVITACION_CIRCULO",
                        idCirculo,
                        circulo.getNombre()
                );
            } catch (Exception e) {
                log.warn("No se pudo crear notificacion para usuario {}: {}", idUsuario, e.getMessage());
            }
        }

        if (auditoriaService != null) {
            auditoriaService.registrar(idUsuario, "usuario_circulo", idCirculo,
                    "INVITAR_USUARIO", null,
                    "{\"id_circulo\":" + idCirculo + ",\"id_usuario\":" + idUsuario + "}");
        }

        if (actividadCirculoService != null) {
            actividadCirculoService.registrarEvento(idCirculo, "MIEMBRO_INVITADO", idUsuario,
                    Map.of("rol", "MIEMBRO"));
        }

        populateTipo(circulo);
        return mapearDetalle(circulo);
    }

    @Transactional
    public CirculoDetalleResponse expulsarMiembro(Long idCirculo, Long idUsuario) {
        CirculoGasto circulo = circuloGastoRepository.findById(idCirculo)
                .orElseThrow(() -> new IllegalArgumentException("CIRCULO_NO_ENCONTRADO"));

        if (idUsuario.equals(circulo.getIdUsuarioCreador())) {
            throw new IllegalStateException("No se puede expulsar al creador del círculo");
        }

        List<UsuarioCirculo> vinculaciones = usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(idCirculo);
        UsuarioCirculo vinculo = vinculaciones.stream()
                .filter(uc -> uc.getId().getIdUsuario().equals(idUsuario))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("USUARIO_NO_ES_MIEMBRO"));

        UsuarioCirculoId vinculoId = new UsuarioCirculoId();
        vinculoId.setIdUsuario(idUsuario);
        vinculoId.setIdCirculoGasto(idCirculo);
        usuarioCirculoRepository.deleteById(vinculoId);
        log.info("Usuario {} expulsado del circulo {}", idUsuario, idCirculo);

        if (auditoriaService != null) {
            auditoriaService.registrar(idUsuario, "usuario_circulo", idCirculo,
                    "EXPULSAR_MIEMBRO",
                    "{\"rol\":\"" + (vinculo.getRolUsuario() != null ? vinculo.getRolUsuario() : "MIEMBRO") + "\"}", null);
        }

        if (actividadCirculoService != null) {
            actividadCirculoService.registrarEvento(idCirculo, "MIEMBRO_EXPULSADO", idUsuario,
                    Map.of("rol_anterior", vinculo.getRolUsuario() != null ? vinculo.getRolUsuario() : "MIEMBRO"));
        }

        populateTipo(circulo);
        return mapearDetalle(circulo);
    }

    @Transactional
    public void delete(Long id) {
        circuloGastoRepository.findById(id).ifPresent(c -> {
            // Borrar hijos en orden para respetar FK constraints
            transaccionRepository.deleteByIdCirculoGasto(id);
            gastoRepository.deleteByIdCirculoGasto(id);
            usuarioCirculoRepository.deleteByCirculoGastoId(id);
            circuloGastoRepository.deleteById(id);
            if (auditoriaService != null) {
                auditoriaService.registrar(c.getIdUsuarioCreador(), "circulo_gasto", id, "DELETE",
                        "{\"nombre\":\"" + c.getNombre() + "\"}", null);
            }
            if (actividadCirculoService != null) {
                try {
                    actividadCirculoService.registrarEvento(id, "CIRCULO_ELIMINADO",
                            c.getIdUsuarioCreador(),
                            Map.of("nombre", c.getNombre()));
                } catch (Exception e) {
                    log.warn("MongoDB audit fallo para CIRCULO_ELIMINADO {}: {}", id, e.getMessage());
                }
            }
        });
    }

    @Transactional
    public CirculoGasto unirseConToken(String token, Long idUsuario) {
        CirculoGasto circulo = findByTokenInvitacion(token)
                .orElseThrow(() -> new IllegalArgumentException("TOKEN_INVALIDO"));

        List<UsuarioCirculo> miembros = usuarioCirculoRepository
                .findByCirculoGasto_IdCirculoGasto(circulo.getIdCirculoGasto());
        boolean yaMiembro = miembros.stream().anyMatch(m -> m.getId().getIdUsuario().equals(idUsuario));
        if (yaMiembro) {
            throw new IllegalStateException("YA_ES_MIEMBRO");
        }

        UsuarioCirculoRequest ucReq = new UsuarioCirculoRequest();
        ucReq.setIdUsuario(idUsuario);
        ucReq.setIdCirculoGasto(circulo.getIdCirculoGasto());
        ucReq.setRolUsuario("MIEMBRO");
        usuarioCirculoService.create(ucReq);

        if (auditoriaService != null) {
            auditoriaService.registrar(idUsuario, "usuario_circulo", circulo.getIdCirculoGasto(),
                    "UNIRSE_CIRCULO", null,
                    "{\"id_circulo\":" + circulo.getIdCirculoGasto() + ",\"id_usuario\":" + idUsuario + "}");
        }

        if (actividadCirculoService != null) {
            try {
                actividadCirculoService.registrarEvento(circulo.getIdCirculoGasto(), "MIEMBRO_UNIDO",
                        idUsuario, Map.of("rol", "MIEMBRO"));
            } catch (Exception e) {
                log.warn("MongoDB audit fallo para MIEMBRO_UNIDO circulo {}: {}", circulo.getIdCirculoGasto(), e.getMessage());
            }
        }

        return circulo;
    }
}
