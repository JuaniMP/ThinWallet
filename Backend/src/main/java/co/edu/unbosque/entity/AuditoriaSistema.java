package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_sistema")
@Data
public class AuditoriaSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Long idAuditoria;

    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "tabla_afectada")
    private String tablaAfectada;

    @Column(name = "registro_id")
    private Long registroId;

    @Column(name = "accion")
    private String accion;

    @Column(name = "valores_anteriores")
    private String valoresAnteriores;

    @Column(name = "valores_nuevos")
    private String valoresNuevos;

    @Column(name = "direccion_ip")
    private String direccionIp;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "ruta_endpoint")
    private String rutaEndpoint;

    @Column(name = "fecha_accion")
    private LocalDateTime fechaAccion;
}