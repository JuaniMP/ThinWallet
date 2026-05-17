package co.edu.unbosque.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Patrón Bucket: agrupa hasta 500 eventos por círculo/día.
 * Reduce millones de documentos individuales a miles de buckets.
 * Colección: actividad_circulo_diaria
 */
@Data
@Document(collection = "actividad_circulo_diaria")
public class ActividadCirculoDiaria {

    @Id
    private String id;

    @Field("id_circulo")
    private Long idCirculo;

    @Field("fecha_bucket")
    private LocalDate fechaBucket;

    /** Secuencia del bucket del día (0, 1, 2…) cuando el anterior se llena */
    @Field("bucket_seq")
    private Integer bucketSeq;

    @Field("eventos")
    private List<EventoCirculo> eventos = new ArrayList<>();

    @Field("total_eventos")
    private Integer totalEventos = 0;

    @Field("creado_en")
    private LocalDateTime creadoEn;

    @Data
    public static class EventoCirculo {

        /** TRANSACCION_REALIZADA | DEUDA_GENERADA | DEUDA_PAGADA | DEUDA_RECHAZADA |
         *  GASTO_PROGRAMADO_CREADO | MESADA_ENVIADA | MIEMBRO_INVITADO | MIEMBRO_EXPULSADO */
        @Field("tipo_evento")
        private String tipoEvento;

        @Field("id_usuario")
        private Long idUsuario;

        @Field("timestamp")
        private LocalDateTime timestamp;

        /** Contexto variable según tipo de evento (monto, motivo, categoria…) */
        @Field("contexto")
        private Map<String, Object> contexto;
    }
}
