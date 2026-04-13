package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "usuario_gasto")
@Data
public class UsuarioGasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario_gasto")
    private Long idUsuarioGasto;

    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "id_gasto")
    private Long idGasto;
}