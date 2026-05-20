package co.edu.unbosque.controller;

import co.edu.unbosque.dto.CierreCicloResponse;
import co.edu.unbosque.request.CierreCicloRequest;
import co.edu.unbosque.service.CicloService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ciclos")
@RequiredArgsConstructor
public class CicloController {

    private final CicloService cicloService;

    /**
     * Cierra el ciclo mensual del círculo. Siempre devuelve HTTP 200; el
     * resultado del SP (1 = ok, 0 = rechazado por reglas de negocio como
     * deudas pendientes) viene en el cuerpo para que el frontend pinte el
     * mensaje amigable que corresponda.
     */
    @PostMapping("/cerrar-mensual")
    public ResponseEntity<CierreCicloResponse> cerrarMensual(@Valid @RequestBody CierreCicloRequest req) {
        CierreCicloResponse out = cicloService.cerrarMensual(req.getIdCirculo(), req.getMes(), req.getAnio());
        return ResponseEntity.ok(out);
    }
}
