package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransaccionRequest {

    @NotBlank
    private String nombre;

    @NotNull
    private BigDecimal montoOriginal;

    private String monedaOriginal;

    private BigDecimal tasaCambio;

    private String tipoMovimiento;


    private String modalidadDivision;

    private String contexto;

    private Long idUsuario;

    private Long idCirculoGasto;

    private Long idCategoria;

    private Long idGasto;

    private Long idTipoMovimiento;
}