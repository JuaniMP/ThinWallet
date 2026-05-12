package co.edu.unbosque.controller;

import co.edu.unbosque.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/pdf/{idUsuario}")
    public ResponseEntity<byte[]> generarPdf(@PathVariable Long idUsuario) {
        byte[] pdf = reporteService.generarPdfUsuario(idUsuario);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reporte_" + idUsuario + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/csv/{idUsuario}")
    public ResponseEntity<byte[]> generarCsv(@PathVariable Long idUsuario) {
        byte[] csv = reporteService.generarCsvTransacciones(idUsuario);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transacciones_" + idUsuario + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
