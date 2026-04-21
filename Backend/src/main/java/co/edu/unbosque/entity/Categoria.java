package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "categoria")
@Data
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Long idCategoria;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "tipo_categoria")
    private String tipoCategoria;

    @Column(name = "exclusiva_perfil_solo")
    private Boolean exclusivaPerfilSolo;

    @Column(name = "frecuencia_uso")
    private Integer frecuenciaUso;

    @Column(name = "estado")
    private Integer estado;

    @Column(name = "id_circulo_gasto")
    private Long idCirculoGasto;
}