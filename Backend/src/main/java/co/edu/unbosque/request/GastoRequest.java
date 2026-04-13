package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class GastoRequest {

    @NotBlank
    private String nombre;

    @NotNull
    private BigDecimal valor;

    private String periodicidad;

    private LocalDateTime fechaInicio;

    private LocalDateTime fechaFin;

    private Long idUsuarioCreador;

    private Long idCirculoGasto;

    private Long idCategoria;
}