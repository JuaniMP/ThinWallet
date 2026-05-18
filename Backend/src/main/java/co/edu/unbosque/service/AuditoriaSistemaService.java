package co.edu.unbosque.service;

import co.edu.unbosque.entity.AuditoriaSistema;
import co.edu.unbosque.repository.AuditoriaSistemaRepository;
import co.edu.unbosque.request.AuditoriaSistemaRequest;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuditoriaSistemaService {

    private final AuditoriaSistemaRepository auditoriaRepository;

    @Transactional(readOnly = true)
    public List<AuditoriaSistema> findAll() {
        return auditoriaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<AuditoriaSistema> findById(Long id) {
        return auditoriaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaSistema> findByUsuario(Long idUsuario) {
        return auditoriaRepository.findByIdUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaSistema> findByTablaAfectada(String tablaAfectada) {
        return auditoriaRepository.findByTablaAfectada(tablaAfectada);
    }

    @Transactional
    public AuditoriaSistema create(AuditoriaSistemaRequest request) {
        AuditoriaSistema auditoria = new AuditoriaSistema();
        auditoria.setIdUsuario(request.getIdUsuario());
        auditoria.setTablaAfectada(request.getTablaAfectada());
        auditoria.setRegistroId(request.getRegistroId());
        auditoria.setAccion(request.getAccion());
        auditoria.setValoresAnteriores(request.getValoresAnteriores());
        auditoria.setValoresNuevos(request.getValoresNuevos());
        auditoria.setDireccionIp(request.getDireccionIp());
        auditoria.setUserAgent(request.getUserAgent());
        auditoria.setRutaEndpoint(request.getRutaEndpoint());
        auditoria.setFechaAccion(LocalDateTime.now());
        return auditoriaRepository.save(auditoria);
    }

    @Transactional
    public void delete(Long id) {
        auditoriaRepository.deleteById(id);
    }

    /** Método conveniente para registrar un evento desde cualquier servicio. */
    @Transactional
    public void registrar(Long idUsuario, String tabla, Long registroId,
                          String accion, String valoresAnteriores, String valoresNuevos) {
        try {
            String ip = null;
            String userAgent = null;
            String ruta = null;
            try {
                ServletRequestAttributes attrs =
                        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attrs != null) {
                    HttpServletRequest req = attrs.getRequest();
                    ip = req.getHeader("X-Forwarded-For");
                    if (ip == null || ip.isBlank()) ip = req.getRemoteAddr();
                    userAgent = req.getHeader("User-Agent");
                    ruta = req.getMethod() + " " + req.getRequestURI();
                }
            } catch (Exception ignored) {}

            AuditoriaSistema a = new AuditoriaSistema();
            a.setIdUsuario(idUsuario);
            a.setTablaAfectada(tabla);
            a.setRegistroId(registroId);
            a.setAccion(accion);
            a.setValoresAnteriores(valoresAnteriores);
            a.setValoresNuevos(valoresNuevos);
            a.setDireccionIp(ip);
            a.setUserAgent(userAgent);
            a.setRutaEndpoint(ruta);
            a.setFechaAccion(LocalDateTime.now());
            auditoriaRepository.save(a);
        } catch (Exception e) {
            log.warn("Auditoría no pudo registrarse [{}/{}]: {}", tabla, registroId, e.getMessage());
        }
    }
}