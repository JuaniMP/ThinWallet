package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificacion", indexes = {
        @Index(name = "idx_notif_usuario", columnList = "id_usuario_destino"),
        @Index(name = "idx_notif_no_leidas", columnList = "id_usuario_destino, leida")
})
@Data
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_notificacion")
    private Long id;

    @Column(name = "id_usuario_destino", nullable = false)
    private Long idUsuarioDestino;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    /** INVITACION_CIRCULO | BIENVENIDA | INFO | GASTO_PROGRAMADO_RECORDATORIO */
    @Column(name = "tipo", nullable = false, length = 60)
    private String tipo;

    @Column(name = "id_circulo_gasto")
    private Long idCirculoGasto;

    @Column(name = "nombre_circulo")
    private String nombreCirculo;

    @Column(name = "leida", nullable = false)
    private boolean leida;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
