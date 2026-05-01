package co.edu.unbosque.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CirculoDetalleResponse {
    private Long idCirculoGasto;
    private String nombre;
    private String tipoCirculo;
    private String monedaBase;
    private String tokenInvitacion;
    private BigDecimal presupuestoGrupal;
    private Boolean permiteMesadas;
    private Boolean permiteSimplificacionDeudas;
    private Long idUsuarioCreador;
    private LocalDateTime fechaCreacion;
    private Integer estado;
    private int totalMiembros;
    private int totalInvitados;
    private List<CirculoInvitadoDetalleResponse> invitados;
}
