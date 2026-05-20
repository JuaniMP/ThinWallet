package co.edu.unbosque.service;

import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.repository.UsuarioRepository;
import co.edu.unbosque.request.SaldoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class SaldoService {

    private final TransaccionRepository transaccionRepository;
    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public Optional<SaldoResponse> calcularSaldo(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            log.warn("Intento de calcular saldo para usuario inexistente: {}", idUsuario);
            return Optional.empty();
        }

        BigDecimal saldoTotal = transaccionRepository.calculateSaldoTotalByUsuario(idUsuario);
        return Optional.of(new SaldoResponse(saldoTotal));
    }

    /**
     * RQ-07 / RQ-13 — Balance neto (ingresos - egresos) de un usuario en un período.
     * Invoca {@code fn_balance_usuario_periodo}.
     */
    @Transactional(readOnly = true)
    public BigDecimal balancePorPeriodo(Long idUsuario, LocalDate fechaInicio, LocalDate fechaFin) {
        BigDecimal balance = jdbcTemplate.queryForObject(
                "SELECT fn_balance_usuario_periodo(?, ?, ?)",
                BigDecimal.class, idUsuario, fechaInicio, fechaFin);
        log.info("fn_balance_usuario_periodo idUsuario={} inicio={} fin={} resultado={}",
                idUsuario, fechaInicio, fechaFin, balance);
        return balance != null ? balance : BigDecimal.ZERO;
    }
}
