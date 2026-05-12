package co.edu.unbosque.controller;

import co.edu.unbosque.dto.CirculoDetalleResponse;
import co.edu.unbosque.entity.CirculoGasto;
import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.request.CirculoGastoRequest;
import co.edu.unbosque.request.UnirseCirculoRequest;
import co.edu.unbosque.request.UsuarioCirculoRequest;
import co.edu.unbosque.service.CirculoGastoService;
import co.edu.unbosque.service.UsuarioCirculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/circulos-gasto")
@RequiredArgsConstructor
public class CirculoGastoController {

    private final CirculoGastoService circuloGastoService;
    private final UsuarioCirculoService usuarioCirculoService;

    @GetMapping
    public ResponseEntity<List<CirculoGasto>> getAll() {
        return ResponseEntity.ok(circuloGastoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CirculoGasto> getById(@PathVariable Long id) {
        return circuloGastoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/detalle")
    public ResponseEntity<CirculoDetalleResponse> getDetalle(@PathVariable Long id) {
        return circuloGastoService.findDetalleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Círculos donde el usuario es creador o miembro */
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<CirculoGasto>> getByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(circuloGastoService.findAllByMiembro(idUsuario));
    }

    /** Alias usado por el frontend del repo de referencia */
    @GetMapping("/miembro/{idUsuario}")
    public ResponseEntity<List<CirculoGasto>> getByMiembro(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(circuloGastoService.findAllByMiembro(idUsuario));
    }

    @GetMapping("/{idCirculo}/miembros")
    public ResponseEntity<List<UsuarioCirculo>> getMiembros(@PathVariable Long idCirculo) {
        return ResponseEntity.ok(usuarioCirculoService.findByCirculoGasto(idCirculo));
    }

    @GetMapping("/invitacion/{token}")
    public ResponseEntity<CirculoGasto> getByToken(@PathVariable String token) {
        return circuloGastoService.findByTokenInvitacion(token)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody CirculoGastoRequest request) {
        CirculoGasto circulo = circuloGastoService.create(request);

        Map<String, Object> respuesta = Map.of(
                "idCirculoGasto", circulo.getIdCirculoGasto(),
                "nombre", circulo.getNombre(),
                "tipoCirculo", circulo.getTipoCirculo() != null ? circulo.getTipoCirculo() : "",
                "monedaBase", circulo.getMonedaBase() != null ? circulo.getMonedaBase() : "COP",
                "tokenInvitacion", circulo.getTokenInvitacionOriginal() != null
                        ? circulo.getTokenInvitacionOriginal()
                        : "No disponible",
                "estado", circulo.getEstado() != null ? circulo.getEstado() : "ACTIVO"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
    }

    @PostMapping("/unirse")
    public ResponseEntity<?> unirse(@Valid @RequestBody UnirseCirculoRequest request) {
        return circuloGastoService.findByTokenInvitacion(request.getToken())
                .map(circulo -> {
                    List<UsuarioCirculo> miembros = usuarioCirculoService.findByCirculoGasto(circulo.getIdCirculoGasto());
                    boolean yaMiembro = miembros.stream().anyMatch(m -> m.getIdUsuario().equals(request.getIdUsuario()));
                    if (yaMiembro) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).<Object>body("Ya eres miembro de este círculo");
                    }
                    UsuarioCirculoRequest ucReq = new UsuarioCirculoRequest();
                    ucReq.setIdUsuario(request.getIdUsuario());
                    ucReq.setIdCirculoGasto(circulo.getIdCirculoGasto());
                    ucReq.setRolUsuario("MIEMBRO");
                    usuarioCirculoService.create(ucReq);
                    return ResponseEntity.ok(circulo);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Token de invitación inválido"));
    }

    @PostMapping("/{id}/invitar-registrado")
    public ResponseEntity<?> invitarRegistrado(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long idUsuario = body.get("idUsuario");
        if (idUsuario == null) {
            return ResponseEntity.badRequest().body("idUsuario es requerido");
        }
        try {
            return ResponseEntity.ok(circuloGastoService.invitarUsuarioRegistrado(id, idUsuario));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            String msg = e.getMessage();
            if ("YA_ES_MIEMBRO".equals(msg)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("El usuario ya es miembro de este círculo");
            }
            return ResponseEntity.badRequest().body("El usuario no puede ser invitado");
        }
    }

    @DeleteMapping("/{idCirculo}/expulsar/{idUsuario}")
    public ResponseEntity<?> expulsarMiembro(@PathVariable Long idCirculo, @PathVariable Long idUsuario) {
        try {
            return ResponseEntity.ok(circuloGastoService.expulsarMiembro(idCirculo, idUsuario));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CirculoGasto> update(@PathVariable Long id, @Valid @RequestBody CirculoGastoRequest request) {
        return circuloGastoService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        circuloGastoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
