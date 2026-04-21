package co.edu.unbosque.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RecuperarPasswordRequest {

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Debe proporcionar un formato de correo valido")
    private String correo;
}
