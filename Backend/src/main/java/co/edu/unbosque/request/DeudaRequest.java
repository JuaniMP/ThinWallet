package co.edu.unbosque.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class DeudaRequest {

    @NotNull
    private BigDecimal monto;

    private String metodoPagoSugerido;

    private BigDecimal porcentajeDivision;

    private String estadoPago;

    private Long idTransaccion;

    private Long idUsuarioDeudor;

    private Long idUsuarioAcreedor;
}