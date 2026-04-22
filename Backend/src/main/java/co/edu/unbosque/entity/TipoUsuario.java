package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tipo_usuario")
@Data
public class TipoUsuario {

    @Id
    @Column(name = "id_tipo_usuario")
    private Long idTipoUsuario; // Sin @GeneratedValue porque los IDs se asignan manualmente (1 o 2)

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;
}