package co.edu.unbosque.service;

import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.repository.GastoRepository;
import co.edu.unbosque.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CronJobService {

    private final GastoRepository gastoRepository;
    private final TransaccionRepository transaccionRepository;

    /**
     * Ejecuta gastos programados recurrentes cada día a medianoche.
     * Crea una transacción por cada gasto cuya fecha_inicio <= ahora y fecha_fin >= ahora.
     * La periodicidad determina si ya se procesó hoy (DIARIO), esta semana (SEMANAL) o este mes (MENSUAL).
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void procesarGastosProgramados() {
        LocalDateTime ahora = LocalDateTime.now();
        List<Gasto> programados = gastoRepository.findAll().stream()
                .filter(g -> g.getPeriodicidad() != null && !g.getPeriodicidad().equals("META"))
                .filter(g -> g.getFechaInicio() != null && !g.getFechaInicio().isAfter(ahora))
                .filter(g -> g.getFechaFin() == null || !g.getFechaFin().isBefore(ahora))
                .filter(g -> g.getValor() != null && g.getIdUsuarioCreador() != null)
                .toList();

        for (Gasto gasto : programados) {
            if (!debeProcesarseHoy(gasto, ahora)) continue;

            Transaccion tx = new Transaccion();
            tx.setNombre(gasto.getNombre());
            tx.setMontoOriginal(gasto.getValor());
            tx.setMonedaOriginal("COP");
            tx.setTipoMovimiento("GASTO");
            tx.setIdUsuario(gasto.getIdUsuarioCreador());
            tx.setIdCirculoGasto(gasto.getIdCirculoGasto());
            tx.setIdCategoria(gasto.getIdCategoria());
            tx.setContexto("gasto_programado:" + gasto.getIdGasto());
            transaccionRepository.save(tx);

            log.info("Gasto programado '{}' ejecutado para usuario {}", gasto.getNombre(), gasto.getIdUsuarioCreador());
        }
    }

    private boolean debeProcesarseHoy(Gasto gasto, LocalDateTime ahora) {
        return switch (gasto.getPeriodicidad().toUpperCase()) {
            case "DIARIO" -> true;
            case "SEMANAL" -> gasto.getFechaInicio().getDayOfWeek() == ahora.getDayOfWeek();
            case "MENSUAL" -> gasto.getFechaInicio().getDayOfMonth() == ahora.getDayOfMonth();
            default -> false;
        };
    }
}
