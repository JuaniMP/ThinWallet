package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuario_circulo")
@Data
public class UsuarioCirculo {

    @EmbeddedId
    private UsuarioCirculoId id;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("idUsuario")
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("idCirculoGasto")
    @JoinColumn(name = "id_circulo_gasto")
    private CirculoGasto circuloGasto;

    @Column(name = "rol_usuario")
    private String rolUsuario;

    @Column(name = "fecha_ingreso")
    private LocalDateTime fechaIngreso;
}