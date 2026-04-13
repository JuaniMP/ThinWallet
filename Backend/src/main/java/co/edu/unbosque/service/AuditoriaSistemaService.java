package co.edu.unbosque.service;

import co.edu.unbosque.entity.AuditoriaSistema;
import co.edu.unbosque.repository.AuditoriaSistemaRepository;
import co.edu.unbosque.request.AuditoriaSistemaRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}