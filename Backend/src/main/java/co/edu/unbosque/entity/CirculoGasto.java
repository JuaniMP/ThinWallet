package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "circulo_gasto")
@Data
public class CirculoGasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_circulo_gasto")
    private Long idCirculoGasto;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "moneda_base")
    private String monedaBase;

    @Column(name = "token_invitacion")
    private String tokenInvitacion;

    @Column(name = "tipo_circulo")
    private String tipoCirculo;

    @Column(name = "presupuesto_grupal")
    private BigDecimal presupuestoGrupal;

    @Column(name = "permite_mesadas")
    private Boolean permiteMesadas;

    @Column(name = "permite_simplificacion_deudas")
    private Boolean permiteSimplificacionDeudas;

    @Column(name = "id_usuario_creador")
    private Long idUsuarioCreador;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "estado")
    private String estado;
}