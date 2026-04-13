package co.edu.unbosque.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoriaRequest {

    @NotBlank
    private String nombre;

    private String descripcion;

    private String tipoCategoria;

    private Boolean exclusivaPerfilSolo;

    private Integer frecuenciaUso;

    private Long idCirculoGasto;
}