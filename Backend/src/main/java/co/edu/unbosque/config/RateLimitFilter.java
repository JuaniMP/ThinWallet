package co.edu.unbosque.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Deque;
import java.util.LinkedList;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RNF-13 — Rate limiting por IP con ventana deslizante en memoria.
 *
 * <p>Permite hasta {@code thinwallet.rate-limit.requests-per-minute} peticiones
 * por IP por minuto. Cuando se excede, responde 429 (Too Many Requests).
 *
 * <p>Implementación deliberadamente simple para no añadir Bucket4j ni Redis:
 * usa un deque de timestamps por IP. Para escalar horizontalmente se debería
 * mover a Redis, pero para una sola instancia VPS es suficiente.
 *
 * <p>Rutas excluidas: SSE (mantiene conexión persistente que rompería la cuenta)
 * y endpoints de auditoría/health.
 */
@Component
@ConditionalOnProperty(name = "thinwallet.rate-limit.enabled", havingValue = "true", matchIfMissing = false)
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;

    @Value("${thinwallet.rate-limit.requests-per-minute:120}")
    private int limit;

    private final Map<String, Deque<Long>> historial = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // SSE mantiene conexión abierta; no debe contar como tráfico repetido.
        if (path.startsWith("/api/eventos/")) return true;
        // Health checks / actuator si en algún momento se agrega
        if (path.startsWith("/actuator")) return true;
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String ip = clientIp(request);
        long now = System.currentTimeMillis();
        Deque<Long> ventana = historial.computeIfAbsent(ip, k -> new LinkedList<>());

        synchronized (ventana) {
            while (!ventana.isEmpty() && now - ventana.peekFirst() > WINDOW_MS) {
                ventana.pollFirst();
            }
            if (ventana.size() >= limit) {
                response.setStatus(429);
                response.setHeader("Retry-After", "60");
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"Too Many Requests\",\"message\":\"Has superado " + limit +
                        " peticiones por minuto. Espera un momento.\"}");
                log.warn("Rate limit excedido para IP {} ({} req/min)", ip, ventana.size());
                return;
            }
            ventana.addLast(now);
        }

        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String fwd = request.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            int comma = fwd.indexOf(',');
            return (comma > 0 ? fwd.substring(0, comma) : fwd).trim();
        }
        String real = request.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        return request.getRemoteAddr();
    }
}
