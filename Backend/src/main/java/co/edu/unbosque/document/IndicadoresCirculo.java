package co.edu.unbosque.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Patrón Approximation: métricas agregadas del círculo actualizadas cada N eventos,
 * no en cada inserción. El líder consulta este documento para su dashboard.
 * Colección: indicadores_circulo
 */
@Data
@Document(collection = "indicadores_circulo")
public class IndicadoresCirculo {

    @Id
    private String id;

    @Field("id_circulo")
    private Long idCirculo;

    @Field("contadores")
    private Contadores contadores = new Contadores();

    @Field("indicadores")
    private IndicadoresDetalle indicadores = new IndicadoresDetalle();

    @Field("categorias_mas_usadas")
    private List<CategoriaUso> categoriasMasUsadas = new ArrayList<>();

    @Field("miembro_mas_activo")
    private Long miembroMasActivo;

    /** Persistir cálculo completo cada N eventos (Approximation Pattern) */
    @Field("umbral_persistencia")
    private Integer umbralPersistencia = 10;

    @Field("ultima_actualizacion")
    private LocalDateTime ultimaActualizacion;

    @Field("creado_en")
    private LocalDateTime creadoEn;

    // ── Clases internas ───────────────────────────────────────────────────────

    @Data
    public static class Contadores {
        @Field("total_transacciones")
        private int totalTransacciones = 0;

        @Field("total_deudas_generadas")
        private int totalDeudasGeneradas = 0;

        @Field("total_deudas_pagadas")
        private int totalDeudasPagadas = 0;

        @Field("total_deudas_rechazadas")
        private int totalDeudasRechazadas = 0;

        @Field("total_gastos_programados")
        private int totalGastosProgramados = 0;

        @Field("total_mesadas_enviadas")
        private int totalMesadasEnviadas = 0;

        @Field("total_miembros_invitados")
        private int totalMiembrosInvitados = 0;

        @Field("total_miembros_expulsados")
        private int totalMiembrosExpulsados = 0;

        /** Eventos acumulados desde el último recálculo completo */
        @Field("eventos_sin_persistir")
        private int eventosSinPersistir = 0;
    }

    @Data
    public static class IndicadoresDetalle {
        @Field("tasa_friccion")
        private TasaFriccion tasaFriccion = new TasaFriccion();

        @Field("nivel_actividad")
        private NivelActividad nivelActividad = new NivelActividad();

        @Field("salud_circulo")
        private SaludCirculo saludCirculo = new SaludCirculo();
    }

    @Data
    public static class TasaFriccion {
        @Field("valor")
        private double valor = 0.0;

        /** BAJO | MEDIO | ALTO */
        @Field("etiqueta")
        private String etiqueta = "BAJO";

        @Field("descripcion")
        private String descripcion = "% de deudas rechazadas vs generadas";
    }

    @Data
    public static class NivelActividad {
        /** NUEVO | DORMIDO | POCO_ACTIVO | ACTIVO | MUY_ACTIVO */
        @Field("valor")
        private String valor = "NUEVO";

        @Field("transacciones_mes")
        private int transaccionesMes = 0;

        @Field("descripcion")
        private String descripcion = "Estado del círculo basado en transacciones recientes";
    }

    @Data
    public static class SaludCirculo {
        @Field("puntuacion")
        private int puntuacion = 100;

        /** EXCELENTE | BUENO | REGULAR | CRITICO */
        @Field("etiqueta")
        private String etiqueta = "EXCELENTE";

        @Field("descripcion")
        private String descripcion = "Índice combinado de actividad y pagos";
    }

    @Data
    public static class CategoriaUso {
        @Field("nombre")
        private String nombre;

        @Field("cantidad")
        private int cantidad;

        @Field("porcentaje")
        private int porcentaje;
    }
}
