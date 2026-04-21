package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TipoCirculoRequest {

    @NotBlank(message = "El nombre del tipo de círculo es obligatorio")
    private String nombre;
}