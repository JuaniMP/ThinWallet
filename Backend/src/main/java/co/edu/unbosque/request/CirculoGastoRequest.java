package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CirculoGastoRequest {

    @NotBlank
    private String nombre;

    private String monedaBase;

    private String tokenInvitacion;

    private String tipoCirculo;

    private Long idTipoCirculo;

    private BigDecimal presupuestoGrupal;

    private Boolean permiteMesadas;

    private Boolean permiteSimplificacionDeudas;

    private Long idUsuarioCreador;

    private List<String> nombresInvitados;
}
