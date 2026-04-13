package co.edu.unbosque.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    private String nombres;

    @NotBlank
    private String apellidos;

    @NotBlank
    private String nombreUsuario;

    @NotBlank @Email
    private String correo;

    @NotBlank @Size(min = 6)
    private String contrasena;
}