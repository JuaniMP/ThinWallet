package co.edu.unbosque.controller;

import co.edu.unbosque.entity.Deuda;
import co.edu.unbosque.request.DeudaRequest;
import co.edu.unbosque.service.DeudaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deudas")
@RequiredArgsConstructor
public class DeudaController {

    private final DeudaService deudaService;

    @GetMapping
    public ResponseEntity<List<Deuda>> getAll() {
        return ResponseEntity.ok(deudaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Deuda> getById(@PathVariable Long id) {
        return deudaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/deudor/{idUsuario}")
    public ResponseEntity<List<Deuda>> getByDeudor(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(deudaService.findByUsuarioDeudor(idUsuario));
    }

    @GetMapping("/acreedor/{idUsuario}")
    public ResponseEntity<List<Deuda>> getByAcreedor(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(deudaService.findByUsuarioAcreedor(idUsuario));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody DeudaRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(deudaService.create(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Deuda> update(@PathVariable Long id, @Valid @RequestBody DeudaRequest request) {
        return deudaService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/confirmar")
    public ResponseEntity<?> confirmarPago(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, Long> body) {
        Long idTransaccion = (body != null) ? body.get("idTransaccion") : null;
        try {
            return deudaService.confirmarPago(id, idTransaccion)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/rechazar")
    public ResponseEntity<?> rechazarPago(@PathVariable Long id,
                                          @RequestBody(required = false) Map<String, String> body) {
        String motivo = (body != null) ? body.get("motivo") : null;
        try {
            return deudaService.rechazarPago(id, motivo)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * RQ-08 — Paso 1: el deudor registra que pagó. Invoca sp_pagar_deuda.
     */
    @PostMapping("/{id}/pagar")
    public ResponseEntity<?> pagar(@PathVariable Long id,
                                   @RequestBody(required = false) Map<String, String> body) {
        String metodoPago = (body != null) ? body.get("metodoPago") : null;
        try {
            return ResponseEntity.ok(deudaService.pagarDeuda(id, metodoPago));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * RQ-07 — Balance de deudas pendientes de un usuario en un círculo.
     * Invoca fn_calcular_deuda_usuario.
     */
    @GetMapping("/balance/{idUsuario}/circulo/{idCirculo}")
    public ResponseEntity<BigDecimal> balanceDeuda(@PathVariable Long idUsuario,
                                                   @PathVariable Long idCirculo) {
        return ResponseEntity.ok(deudaService.calcularDeudaUsuario(idUsuario, idCirculo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deudaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}