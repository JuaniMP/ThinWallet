package co.edu.unbosque.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioGastoRequest {

    @NotNull
    private Long idUsuario;

    @NotNull
    private Long idGasto;
}