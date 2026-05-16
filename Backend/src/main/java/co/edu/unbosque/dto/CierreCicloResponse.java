package co.edu.unbosque.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CierreCicloResponse {
    private Integer resultado;
    private String mensaje;
    private Long idCirculo;
    private Integer mes;
    private Integer anio;
}
