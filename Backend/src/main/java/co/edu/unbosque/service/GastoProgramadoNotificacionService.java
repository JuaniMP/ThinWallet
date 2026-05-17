package co.edu.unbosque.service;

import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.repository.GastoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class GastoProgramadoNotificacionService {

    private final GastoRepository gastoRepository;

    @Autowired(required = false)
    private NotificacionService notificacionService;

    // Corre todos los días a las 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void notificarGastosProgramados() {
        if (notificacionService == null) return;

        LocalDate hoy = LocalDate.now();
        List<Gasto> candidatos = gastoRepository.findAll().stream()
                .filter(g -> esGastoProgramado(g.getPeriodicidad()))
                .filter(g -> g.getIdUsuarioCreador() != null)
                .filter(g -> !estaExpirado(g, hoy))
                .filter(g -> tocaHoy(g, hoy))
                .toList();

        for (Gasto g : candidatos) {
            try {
                String label = labelPeriodicidad(g.getPeriodicidad());
                notificacionService.crear(
                        g.getIdUsuarioCreador(),
                        "Pago programado: " + g.getNombre(),
                        "Tienes un " + label + " programado de $"
                                + g.getValor().longValue() + ". ¡No olvides pagarlo!",
                        "GASTO_PROGRAMADO_RECORDATORIO",
                        null,
                        null
                );
                log.info("Notificación enviada a usuario {} por gasto '{}'",
                        g.getIdUsuarioCreador(), g.getNombre());
            } catch (Exception e) {
                log.warn("Error notificando gasto {}: {}", g.getIdGasto(), e.getMessage());
            }
        }
    }

    private boolean esGastoProgramado(String periodicidad) {
        return periodicidad != null && List.of(
                "DIARIO", "SEMANAL", "MENSUAL", "TRIMESTRAL", "ANUAL"
        ).contains(periodicidad);
    }

    private boolean estaExpirado(Gasto g, LocalDate hoy) {
        if (g.getFechaFin() == null) return false;
        return g.getFechaFin().toLocalDate().isBefore(hoy);
    }

    private boolean tocaHoy(Gasto g, LocalDate hoy) {
        if (g.getFechaInicio() == null) return false;
        LocalDate inicio = g.getFechaInicio().toLocalDate();
        if (inicio.isAfter(hoy)) return false;

        return switch (g.getPeriodicidad()) {
            case "DIARIO"      -> true;
            case "SEMANAL"     -> inicio.getDayOfWeek() == hoy.getDayOfWeek();
            case "MENSUAL"     -> inicio.getDayOfMonth() == hoy.getDayOfMonth();
            case "TRIMESTRAL"  -> {
                long meses = java.time.temporal.ChronoUnit.MONTHS.between(inicio, hoy);
                yield meses >= 0 && meses % 3 == 0 && inicio.getDayOfMonth() == hoy.getDayOfMonth();
            }
            case "ANUAL"       ->
                inicio.getDayOfMonth() == hoy.getDayOfMonth() &&
                inicio.getMonth() == hoy.getMonth();
            default -> false;
        };
    }

    private String labelPeriodicidad(String p) {
        return switch (p) {
            case "DIARIO"     -> "gasto diario";
            case "SEMANAL"    -> "gasto semanal";
            case "MENSUAL"    -> "gasto mensual";
            case "TRIMESTRAL" -> "gasto trimestral";
            case "ANUAL"      -> "gasto anual";
            default           -> "gasto";
        };
    }
}
