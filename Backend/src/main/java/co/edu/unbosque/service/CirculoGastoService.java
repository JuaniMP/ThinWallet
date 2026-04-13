package co.edu.unbosque.service;

import co.edu.unbosque.entity.CirculoGasto;
import co.edu.unbosque.repository.CirculoGastoRepository;
import co.edu.unbosque.request.CirculoGastoRequest;
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
public class CirculoGastoService {

    private final CirculoGastoRepository circuloGastoRepository;

    @Transactional(readOnly = true)
    public List<CirculoGasto> findAll() {
        return circuloGastoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<CirculoGasto> findById(Long id) {
        return circuloGastoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<CirculoGasto> findByTokenInvitacion(String tokenInvitacion) {
        return circuloGastoRepository.findByTokenInvitacion(tokenInvitacion);
    }

    @Transactional
    public CirculoGasto create(CirculoGastoRequest request) {
        CirculoGasto circulo = new CirculoGasto();
        circulo.setNombre(request.getNombre());
        circulo.setMonedaBase(request.getMonedaBase());
        circulo.setTokenInvitacion(request.getTokenInvitacion());
        circulo.setTipoCirculo(request.getTipoCirculo());
        circulo.setPresupuestoGrupal(request.getPresupuestoGrupal());
        circulo.setPermiteMesadas(request.getPermiteMesadas());
        circulo.setPermiteSimplificacionDeudas(request.getPermiteSimplificacionDeudas());
        circulo.setIdUsuarioCreador(request.getIdUsuarioCreador());
        circulo.setFechaCreacion(LocalDateTime.now());
        circulo.setEstado("ACTIVO");
        return circuloGastoRepository.save(circulo);
    }

    @Transactional
    public Optional<CirculoGasto> update(Long id, CirculoGastoRequest request) {
        return circuloGastoRepository.findById(id).map(circulo -> {
            circulo.setNombre(request.getNombre());
            circulo.setMonedaBase(request.getMonedaBase());
            circulo.setTipoCirculo(request.getTipoCirculo());
            circulo.setPresupuestoGrupal(request.getPresupuestoGrupal());
            circulo.setPermiteMesadas(request.getPermiteMesadas());
            circulo.setPermiteSimplificacionDeudas(request.getPermiteSimplificacionDeudas());
            return circuloGastoRepository.save(circulo);
        });
    }

    @Transactional
    public void delete(Long id) {
        circuloGastoRepository.deleteById(id);
    }
}