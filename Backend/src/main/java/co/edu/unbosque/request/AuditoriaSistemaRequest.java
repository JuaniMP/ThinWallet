package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AuditoriaSistemaRequest {

    private Long idUsuario;

    @NotBlank
    private String tablaAfectada;

    @NotNull
    private Long registroId;

    @NotBlank
    private String accion;

    private String valoresAnteriores;

    private String valoresNuevos;

    private String direccionIp;

    private String userAgent;

    private String rutaEndpoint;
}