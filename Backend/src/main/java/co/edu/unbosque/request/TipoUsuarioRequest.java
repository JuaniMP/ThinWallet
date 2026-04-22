package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TipoUsuarioRequest {

    @NotNull(message = "El ID del tipo de usuario es obligatorio")
    private Long idTipoUsuario;

    @NotBlank(message = "El nombre del tipo de usuario es obligatorio")
    private String nombre;
}