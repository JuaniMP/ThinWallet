package co.edu.unbosque.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UsuarioRequest {

    @NotBlank
    private String nombres;

    @NotBlank
    private String apellidos;

    private String nombreUsuario;

    @NotBlank @Email
    private String correo;

    @NotBlank
    private String contrasenaHash;

    private String tipoUsuario;

    private String descripcion;
}