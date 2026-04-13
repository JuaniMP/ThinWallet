package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CirculoGastoRequest {

    @NotBlank
    private String nombre;

    private String monedaBase;

    private String tokenInvitacion;

    private String tipoCirculo;

    private BigDecimal presupuestoGrupal;

    private Boolean permiteMesadas;

    private Boolean permiteSimplificacionDeudas;

    private Long idUsuarioCreador;
}