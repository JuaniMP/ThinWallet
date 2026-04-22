package co.edu.unbosque.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NuevaPasswordRequest {

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Debe proporcionar un formato de correo valido")
    private String correo;

    @NotBlank(message = "El codigo es obligatorio")
    private String codigo;

    @NotBlank(message = "La nueva contrasena es obligatoria")
    private String nuevaContrasena;
}
