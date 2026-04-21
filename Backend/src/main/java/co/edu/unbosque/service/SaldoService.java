package co.edu.unbosque.service;

import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.repository.UsuarioRepository;
import co.edu.unbosque.request.SaldoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class SaldoService {

    private final TransaccionRepository transaccionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public Optional<SaldoResponse> calcularSaldo(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            log.warn("Intento de calcular saldo para usuario inexistente: {}", idUsuario);
            return Optional.empty();
        }

        BigDecimal saldoTotal = transaccionRepository.calculateSaldoTotalByUsuario(idUsuario);
        return Optional.of(new SaldoResponse(saldoTotal));
    }
}
