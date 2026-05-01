package co.edu.unbosque.service;

import co.edu.unbosque.dto.CirculoDetalleResponse;
import co.edu.unbosque.dto.CirculoInvitadoDetalleResponse;
import co.edu.unbosque.entity.CirculoGasto;
import co.edu.unbosque.entity.TipoCirculo;
import co.edu.unbosque.entity.TipoUsuario;
import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.entity.UsuarioCirculoId;
import co.edu.unbosque.repository.CirculoGastoRepository;
import co.edu.unbosque.repository.TipoCirculoRepository;
import co.edu.unbosque.repository.TipoUsuarioRepository;
import co.edu.unbosque.repository.UsuarioCirculoRepository;
import co.edu.unbosque.repository.UsuarioRepository;
import co.edu.unbosque.request.CirculoGastoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class CirculoGastoService {

    private final CirculoGastoRepository circuloGastoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioCirculoRepository usuarioCirculoRepository;
    private final TipoUsuarioRepository tipoUsuarioRepository;
    private final TipoCirculoRepository tipoCirculoRepository;
    private final TokenHashingService tokenHashingService;

    @Transactional(readOnly = true)
    public List<CirculoGasto> findAll() {
        return circuloGastoRepository.findAll()
                .stream()
                .map(this::enriquecerTipoCirculo)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<CirculoGasto> findById(Long id) {
        return circuloGastoRepository.findById(id).map(this::enriquecerTipoCirculo);
    }

    @Transactional(readOnly = true)
    public Optional<CirculoDetalleResponse> findDetalleById(Long id) {
        return circuloGastoRepository.findById(id)
                .map(this::enriquecerTipoCirculo)
                .map(this::mapearDetalle);
    }

    @Transactional(readOnly = true)
    public Optional<CirculoGasto> findByTokenInvitacion(String tokenInvitacion) {
        // Obtener todos los círculos para validar contra tokens hasheados en BD
        List<CirculoGasto> todosCirculos = circuloGastoRepository.findAll();
        for (CirculoGasto circulo : todosCirculos) {
            if (circulo.getTokenInvitacion() != null && 
                tokenHashingService.validateToken(tokenInvitacion, circulo.getTokenInvitacion())) {
                return Optional.of(enriquecerTipoCirculo(circulo));
            }
        }
        return Optional.empty();
    }

    @Transactional(readOnly = true)
    public List<CirculoGasto> findByMiembro(Long idUsuario) {
        // Obtener todas las vinculaciones del usuario a círculos
        List<UsuarioCirculo> vinculaciones = usuarioCirculoRepository.findByUsuario_IdUsuario(idUsuario);
        
        // Mapear a CirculoGasto y enriquecer con tipoCirculo
        return vinculaciones.stream()
                .map(UsuarioCirculo::getCirculoGasto)
                .map(this::enriquecerTipoCirculo)
                .toList();
    }

    @Transactional
    public CirculoGasto create(CirculoGastoRequest request) {
        log.info("Creando nuevo círculo de gasto: {}", request.getNombre());

        CirculoGasto circulo = new CirculoGasto();
        circulo.setNombre(request.getNombre());
        circulo.setMonedaBase(request.getMonedaBase() != null ? request.getMonedaBase() : "COP");
        circulo.setIdTipoCirculo(resolverIdTipoCirculo(request));
        circulo.setPresupuestoGrupal(request.getPresupuestoGrupal());
        circulo.setPermiteMesadas(request.getPermiteMesadas());
        circulo.setPermiteSimplificacionDeudas(request.getPermiteSimplificacionDeudas());
        circulo.setIdUsuarioCreador(request.getIdUsuarioCreador());
        circulo.setFechaCreacion(LocalDateTime.now());
        circulo.setEstado(1);
        
        // Generar token
        String tokenOriginal;
        if (request.getTokenInvitacion() != null && !request.getTokenInvitacion().isBlank()) {
            tokenOriginal = request.getTokenInvitacion();
        } else {
            tokenOriginal = tokenHashingService.generateToken();
        }
        
        // Guardar token hasheado en BD (seguro para validar)
        circulo.setTokenInvitacion(tokenHashingService.hashToken(tokenOriginal));
        // Guardar token original para mostrar en frontend
        circulo.setTokenInvitacionOriginal(tokenOriginal);

        CirculoGasto circuloGuardado = circuloGastoRepository.save(circulo);

        vincularUsuarioAlCirculo(request.getIdUsuarioCreador(), circuloGuardado);

        if (request.getNombresInvitados() != null && !request.getNombresInvitados().isEmpty()) {
            crearInvitadosFantasmas(request.getNombresInvitados(), circuloGuardado);
        }

        return enriquecerTipoCirculo(circuloGuardado);
    }

    private Long resolverIdTipoCirculo(CirculoGastoRequest request) {
        if (request.getIdTipoCirculo() != null) {
            boolean existe = tipoCirculoRepository.existsById(request.getIdTipoCirculo());
            if (!existe) {
                throw new RuntimeException("Tipo de círculo no existe con id: " + request.getIdTipoCirculo());
            }
            return request.getIdTipoCirculo();
        }

        if (request.getTipoCirculo() != null && !request.getTipoCirculo().isBlank()) {
            TipoCirculo tipo = tipoCirculoRepository.findByNombre(request.getTipoCirculo())
                    .orElseThrow(() -> new RuntimeException("Tipo de círculo no existe con nombre: " + request.getTipoCirculo()));
            return tipo.getIdTipoCirculo();
        }

        throw new RuntimeException("Debes enviar idTipoCirculo o tipoCirculo");
    }

    private CirculoGasto enriquecerTipoCirculo(CirculoGasto circulo) {
        if (circulo.getIdTipoCirculo() != null) {
            tipoCirculoRepository.findById(circulo.getIdTipoCirculo())
                    .ifPresent(tipo -> circulo.setTipoCirculo(tipo.getNombre()));
        }
        return circulo;
    }

    private CirculoDetalleResponse mapearDetalle(CirculoGasto circulo) {
        List<UsuarioCirculo> vinculaciones = usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(circulo.getIdCirculoGasto());
        List<CirculoInvitadoDetalleResponse> invitados = new ArrayList<>();

        for (UsuarioCirculo vinculacion : vinculaciones) {
            Usuario usuario = vinculacion.getUsuario();
            if (usuario == null || usuario.getIdUsuario().equals(circulo.getIdUsuarioCreador())) {
                continue;
            }

            CirculoInvitadoDetalleResponse invitado = new CirculoInvitadoDetalleResponse();
            invitado.setIdUsuario(usuario.getIdUsuario());
            invitado.setNombreCompleto((usuario.getNombres() + " " + usuario.getApellidos()).trim());
            invitado.setCorreo(usuario.getCorreo());

            String tipoUsuarioNombre = null;
            if (usuario.getTipoUsuario() != null) {
                tipoUsuarioNombre = usuario.getTipoUsuario().getNombre();
            }
            invitado.setTipoUsuario(tipoUsuarioNombre);

            boolean esFantasma = tipoUsuarioNombre != null && "FANTASMA".equalsIgnoreCase(tipoUsuarioNombre);
            invitado.setTokenInvitacionPersonal(esFantasma ? usuario.getTokenReclamo() : null);

            invitados.add(invitado);
        }

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
        detalle.setFechaCreacion(circulo.getFechaCreacion());
        detalle.setEstado(circulo.getEstado());
        detalle.setTotalMiembros(vinculaciones.size());
        detalle.setTotalInvitados(invitados.size());
        detalle.setInvitados(invitados);

        return detalle;
    }

    private String generarTokenInvitacionUnico() {
        String token = tokenHashingService.generateToken();
        log.info("Token de invitación generado");
        return token;
    }

    private String generarTokenReclamoUnico() {
        String token = tokenHashingService.generateToken();
        log.info("Token de reclamo generado");
        return token;
    }

    /**
     * Valida regla de negocio: usuarios normales DEBEN tener contrasena_hash y correo
     * Usuarios fantasma pueden tener NULL en estos campos
     */
    private void validarUsuarioNormal(Usuario usuario) {
        if (usuario.getTipoUsuario() != null && !"FANTASMA".equals(usuario.getTipoUsuario().getNombre())) {
            if (usuario.getContrasenaHash() == null || usuario.getContrasenaHash().isBlank()) {
                throw new RuntimeException("Regla de negocio: Usuarios normales DEBEN tener contraseña");
            }
            if (usuario.getCorreo() == null || usuario.getCorreo().isBlank()) {
                throw new RuntimeException("Regla de negocio: Usuarios normales DEBEN tener correo");
            }
        }
    }

    private void crearInvitadosFantasmas(List<String> nombres, CirculoGasto circulo) {
        TipoUsuario tipoFantasma = tipoUsuarioRepository.findByNombre("FANTASMA")
                .orElseThrow(() -> new RuntimeException("Error: El tipo 'FANTASMA' no existe en la base de datos."));

        for (String nombre : nombres) {
            Usuario fantasma = new Usuario();
            
            // Dividir el nombre en nombres y apellidos
            String[] partes = nombre.trim().split("\\s+", 2);
            fantasma.setNombres(partes[0]);
            fantasma.setApellidos(partes.length > 1 ? partes[1] : partes[0]);
            
            fantasma.setTipoUsuario(tipoFantasma);
            
            // Generar token de reclamo
            String tokenReclamoOriginal = tokenHashingService.generateToken();
            // Guardar hasheado en BD para validación
            fantasma.setTokenReclamo(tokenHashingService.hashToken(tokenReclamoOriginal));
            // Guardar original para mostrar en frontend
            fantasma.setTokenReclamoOriginal(tokenReclamoOriginal);
            
            fantasma.setEstado(1);
            fantasma.setFechaRegistro(LocalDateTime.now());
            // Usuarios fantasma no tienen contraseña ni correo (NULL por regla de negocio)
            fantasma.setContrasenaHash(null);
            fantasma.setCorreo(null);

            Usuario fantasmaGuardado = usuarioRepository.save(fantasma);
            vincularUsuarioAlCirculo(fantasmaGuardado.getIdUsuario(), circulo);

            log.info("Usuario Fantasma '{}' creado con Token hasheado en BD", nombre);
        }
    }

    private void vincularUsuarioAlCirculo(Long idUsuario, CirculoGasto circulo) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + idUsuario));

        UsuarioCirculo vinculacion = new UsuarioCirculo();
        UsuarioCirculoId idVinculacion = new UsuarioCirculoId();
        idVinculacion.setIdUsuario(idUsuario);
        idVinculacion.setIdCirculoGasto(circulo.getIdCirculoGasto());
        vinculacion.setId(idVinculacion);
        vinculacion.setUsuario(usuario);
        vinculacion.setCirculoGasto(circulo);
        vinculacion.setFechaIngreso(LocalDateTime.now());

        usuarioCirculoRepository.save(vinculacion);
    }

    @Transactional
    public Optional<CirculoGasto> update(Long id, CirculoGastoRequest request) {
        return circuloGastoRepository.findById(id).map(circulo -> {
            circulo.setNombre(request.getNombre());
            circulo.setMonedaBase(request.getMonedaBase());
            circulo.setIdTipoCirculo(resolverIdTipoCirculo(request));
            circulo.setPresupuestoGrupal(request.getPresupuestoGrupal());
            circulo.setPermiteMesadas(request.getPermiteMesadas());
            circulo.setPermiteSimplificacionDeudas(request.getPermiteSimplificacionDeudas());

            CirculoGasto actualizado = circuloGastoRepository.save(circulo);
            return enriquecerTipoCirculo(actualizado);
        });
    }

    @Transactional
    public void delete(Long id) {
        usuarioCirculoRepository.deleteByCirculoGastoId(id);
        circuloGastoRepository.deleteById(id);
    }
}