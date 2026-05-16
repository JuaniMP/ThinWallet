package co.edu.unbosque.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * RF-07 — Bus de eventos en memoria que mantiene un {@link SseEmitter} por
 * cada conexión activa de cada usuario. Permite empujar actualizaciones
 * de saldo y deudas en tiempo real al frontend.
 *
 * <p>Mantenido in-process; no requiere Redis ni dependencias externas.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SseEventBus {

    /** Timeout largo: 1 hora. El navegador reconecta automáticamente. */
    public static final long DEFAULT_TIMEOUT = 60 * 60 * 1000L;

    private final Map<Long, List<SseEmitter>> conexiones = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private SaldoService saldoService;

    public SseEmitter registrar(Long idUsuario) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        conexiones.computeIfAbsent(idUsuario, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> {
            List<SseEmitter> lista = conexiones.get(idUsuario);
            if (lista != null) lista.remove(emitter);
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("conectado").data("ok"));
            // Push inicial de saldo para que el cliente arranque con dato fresco.
            publicarSaldo(idUsuario);
        } catch (IOException e) {
            log.debug("Error en mensaje inicial SSE para usuario {}: {}", idUsuario, e.getMessage());
        }
        return emitter;
    }

    public void publicarSaldo(Long idUsuario) {
        if (idUsuario == null || saldoService == null) return;
        List<SseEmitter> lista = conexiones.get(idUsuario);
        if (lista == null || lista.isEmpty()) return;

        try {
            saldoService.calcularSaldo(idUsuario).ifPresent(saldo -> emitir(idUsuario, "saldo", saldo));
        } catch (Exception e) {
            log.debug("No se pudo publicar saldo para usuario {}: {}", idUsuario, e.getMessage());
        }
    }

    public void publicarEvento(Long idUsuario, String nombre, Object payload) {
        emitir(idUsuario, nombre, payload);
    }

    private void emitir(Long idUsuario, String nombre, Object payload) {
        List<SseEmitter> lista = conexiones.get(idUsuario);
        if (lista == null) return;
        for (SseEmitter e : lista) {
            try {
                e.send(SseEmitter.event().name(nombre).data(payload));
            } catch (Exception ex) {
                e.completeWithError(ex);
            }
        }
    }
}
