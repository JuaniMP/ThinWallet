package co.edu.unbosque.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tipo_usuario")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TipoUsuario {

    @Id
    @Column(name = "id_tipo_usuario")
    private Long idTipoUsuario; // Sin @GeneratedValue porque los IDs se asignan manualmente (1 o 2)

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;
}