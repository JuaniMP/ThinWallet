package co.edu.unbosque.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Respuesta del Coach Financiero (RF-11): regla 50/30/20.
 * - 50% Necesidades (vivienda, comida, transporte, salud, servicios…)
 * - 30% Deseos (entretenimiento, ropa, suscripciones…)
 * - 20% Ahorro
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoachRecomendacionResponse {
    private Long idUsuario;
    private BigDecimal ingresoMensual;

    // Objetivos según 50/30/20
    private BigDecimal necesidadesMax;
    private BigDecimal deseosMax;
    private BigDecimal ahorroObjetivo;

    // Gasto real del último mes
    private BigDecimal gastoNecesidades;
    private BigDecimal gastoDeseos;
    private BigDecimal gastoTotal;

    // % consumido vs. límite
    private BigDecimal porcentajeNecesidades;
    private BigDecimal porcentajeDeseos;
    private BigDecimal cumplimientoAhorro; // 0..100

    // Mensajes accionables
    private List<String> recomendaciones;

    // Desglose por categoria para charts
    private Map<String, BigDecimal> gastoPorCategoria;
}
