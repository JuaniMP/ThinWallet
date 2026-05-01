package co.edu.unbosque.controller;

import co.edu.unbosque.dto.CirculoDetalleResponse;
import co.edu.unbosque.dto.CirculoGastoConTokenResponse;
import co.edu.unbosque.entity.CirculoGasto;
import co.edu.unbosque.request.CirculoGastoRequest;
import co.edu.unbosque.service.CirculoGastoService;
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
    public ResponseEntity<CirculoDetalleResponse> getDetalleById(@PathVariable Long id) {
        return circuloGastoService.findDetalleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/miembro/{idUsuario}")
    public ResponseEntity<List<CirculoGasto>> getCirclesByMember(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(circuloGastoService.findByMiembro(idUsuario));
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
        
        // Devolver el círculo con el token sin hashear
        Map<String, Object> respuesta = Map.of(
            "idCirculoGasto", circulo.getIdCirculoGasto(),
            "nombre", circulo.getNombre(),
            "tipoCirculo", circulo.getTipoCirculo(),
            "monedaBase", circulo.getMonedaBase(),
            "tokenInvitacion", circulo.getTokenInvitacionOriginal() != null ? circulo.getTokenInvitacionOriginal() : "No disponible",
            "estado", circulo.getEstado()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
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