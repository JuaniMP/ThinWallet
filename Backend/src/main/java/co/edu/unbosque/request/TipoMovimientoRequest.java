package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TipoMovimientoRequest {

    @NotBlank(message = "El nombre del tipo de movimiento es obligatorio")
    private String nombre;
}