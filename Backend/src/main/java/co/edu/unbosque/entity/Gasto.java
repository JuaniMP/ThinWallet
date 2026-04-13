package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "gasto")
@Data
public class Gasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_gasto")
    private Long idGasto;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "valor")
    private BigDecimal valor;

    @Column(name = "periodicidad")
    private String periodicidad;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(name = "id_usuario_creador")
    private Long idUsuarioCreador;

    @Column(name = "id_circulo_gasto")
    private Long idCirculoGasto;

    @Column(name = "id_categoria")
    private Long idCategoria;
}