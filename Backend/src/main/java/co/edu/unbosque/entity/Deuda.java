package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deuda")
@Data
public class Deuda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_deuda")
    private Long idDeuda;

    @Column(name = "monto")
    private BigDecimal monto;

    @Column(name = "metodo_pago_sugerido")
    private String metodoPagoSugerido;

    @Column(name = "porcentaje_division")
    private BigDecimal porcentajeDivision;

    @Column(name = "estado_pago")
    private String estadoPago;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_confirmada")
    private LocalDateTime fechaConfirmada;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

    @Column(name = "id_transaccion")
    private Long idTransaccion;

    @Column(name = "id_usuario_deudor")
    private Long idUsuarioDeudor;

    @Column(name = "id_usuario_acreedor")
    private Long idUsuarioAcreedor;
}