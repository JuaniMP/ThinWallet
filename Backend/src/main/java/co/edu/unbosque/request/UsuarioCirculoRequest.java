package co.edu.unbosque.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioCirculoRequest {

    @NotNull
    private Long idUsuario;

    @NotNull
    private Long idCirculoGasto;

    private String rolUsuario;
}