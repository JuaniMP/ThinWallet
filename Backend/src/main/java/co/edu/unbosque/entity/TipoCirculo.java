package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tipo_circulo")
@Data
public class TipoCirculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_circulo")
    private Long idTipoCirculo;

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;
}