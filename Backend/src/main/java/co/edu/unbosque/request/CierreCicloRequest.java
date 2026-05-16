package co.edu.unbosque.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CierreCicloRequest {

    @NotNull
    private Long idCirculo;

    @NotNull
    @Min(1) @Max(12)
    private Integer mes;

    @NotNull
    @Min(2000) @Max(2100)
    private Integer anio;
}
