package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tipo_movimiento")
@Data
public class TipoMovimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_movimiento")
    private Long idTipoMovimiento;

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;
}