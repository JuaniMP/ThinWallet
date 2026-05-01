package co.edu.unbosque.dto;

import lombok.Data;

@Data
public class CirculoInvitadoDetalleResponse {
    private Long idUsuario;
    private String nombreCompleto;
    private String tipoUsuario;
    private String tokenInvitacionPersonal;
    private String correo;
}
