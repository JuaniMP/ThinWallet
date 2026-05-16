package co.edu.unbosque.controller;

import co.edu.unbosque.dto.CierreCicloResponse;
import co.edu.unbosque.request.CierreCicloRequest;
import co.edu.unbosque.service.CicloService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ciclos")
@RequiredArgsConstructor
public class CicloController {

    private final CicloService cicloService;

    @PostMapping("/cerrar-mensual")
    public ResponseEntity<CierreCicloResponse> cerrarMensual(@Valid @RequestBody CierreCicloRequest req) {
        CierreCicloResponse out = cicloService.cerrarMensual(req.getIdCirculo(), req.getMes(), req.getAnio());
        if (out.getResultado() != null && out.getResultado() == 1) {
            return ResponseEntity.ok(out);
        }
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(out);
    }
}
