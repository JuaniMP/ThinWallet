package co.edu.unbosque.dto;

import co.edu.unbosque.entity.Transaccion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GastosHormigaResponse {
    private Long idUsuario;
    private BigDecimal umbralMonto;
    private Integer dias;
    private Integer cantidad;
    private BigDecimal totalGastado;
    private List<Transaccion> transacciones;
}
