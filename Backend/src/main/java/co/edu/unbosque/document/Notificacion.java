package co.edu.unbosque.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Document(collection = "notificaciones")
public class Notificacion {

    @Id
    private String id;

    @Field("id_usuario_destino")
    private Long idUsuarioDestino;

    @Field("titulo")
    private String titulo;

    @Field("mensaje")
    private String mensaje;

    /** INVITACION_CIRCULO | BIENVENIDA | INFO */
    @Field("tipo")
    private String tipo;

    @Field("id_circulo_gasto")
    private Long idCirculoGasto;

    @Field("nombre_circulo")
    private String nombreCirculo;

    @Field("leida")
    private boolean leida;

    @Field("fecha_creacion")
    private LocalDateTime fechaCreacion;
}
