package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "transaccion")
@Data
public class Transaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_transaccion")
    private Long idTransaccion;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "monto_original")
    private BigDecimal montoOriginal;

    @Column(name = "moneda_original")
    private String monedaOriginal;

    @Column(name = "tasa_cambio")
    private BigDecimal tasaCambio;

    @Transient
    private String tipoMovimiento;


    @Column(name = "modalidad_division")
    private String modalidadDivision;

    @Column(name = "contexto")
    private String contexto;

    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "id_circulo_gasto")
    private Long idCirculoGasto;

    @Column(name = "id_categoria")
    private Long idCategoria;

    @Column(name = "id_gasto")
    private Long idGasto;

    @Column(name = "id_tipo_movimiento")
    private Long idTipoMovimiento;
}