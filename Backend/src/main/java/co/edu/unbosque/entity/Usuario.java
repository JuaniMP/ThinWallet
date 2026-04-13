package co.edu.unbosque.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuario")
@Data
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "nombres")
    private String nombres;

    @Column(name = "apellidos")
    private String apellidos;

    @Column(name = "nombre_usuario", unique = true)
    private String nombreUsuario;

    @Column(name = "correo", unique = true, nullable = false)
    private String correo;

    @JsonIgnore
    @Column(name = "contrasena_hash", nullable = false)
    private String contrasenaHash;

    @Column(name = "tipo_usuario")
    private String tipoUsuario;

    @Column(name = "token_reclamo")
    private String tokenReclamo;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    @Column(name = "estado")
    private Integer estado;
}