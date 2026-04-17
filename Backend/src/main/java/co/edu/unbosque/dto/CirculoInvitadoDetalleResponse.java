package co.edu.unbosque.dto;

import lombok.Data;

@Data
public class CirculoInvitadoDetalleResponse {
    private Long idUsuario;
    private String nombreCompleto;
    private String correo;
    private String tipoUsuario;
    private String rolUsuario;
    private String tokenInvitacionPersonal;
}
