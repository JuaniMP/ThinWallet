package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UnirseCirculoRequest {

    @NotBlank
    private String token;

    @NotNull
    private Long idUsuario;
}
