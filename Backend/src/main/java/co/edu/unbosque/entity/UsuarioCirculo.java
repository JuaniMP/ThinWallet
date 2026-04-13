package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuario_circulo")
@Data
public class UsuarioCirculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario_circulo")
    private Long idUsuarioCirculo;

    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "id_circulo_gasto")
    private Long idCirculoGasto;

    @Column(name = "rol_usuario")
    private String rolUsuario;

    @Column(name = "fecha_ingreso")
    private LocalDateTime fechaIngreso;
}