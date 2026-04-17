package co.edu.unbosque.service;

import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.repository.GastoRepository;
import co.edu.unbosque.request.GastoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class GastoService {

    private final GastoRepository gastoRepository;

    @Transactional(readOnly = true)
    public List<Gasto> findAll() {
        return gastoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Gasto> findById(Long id) {
        return gastoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Gasto> findByUsuarioCreador(Long idUsuarioCreador) {
        return gastoRepository.findByIdUsuarioCreador(idUsuarioCreador);
    }

    @Transactional(readOnly = true)
    public List<Gasto> findByCirculoGasto(Long idCirculoGasto) {
        return gastoRepository.findByIdCirculoGasto(idCirculoGasto);
    }

    @Transactional
    public Gasto create(GastoRequest request) {
        Gasto gasto = new Gasto();
        gasto.setNombre(request.getNombre());
        gasto.setValor(request.getValor());
        gasto.setPeriodicidad(request.getPeriodicidad());
        gasto.setFechaInicio(request.getFechaInicio());
        gasto.setFechaFin(request.getFechaFin());
        gasto.setIdUsuarioCreador(request.getIdUsuarioCreador());
        gasto.setIdCirculoGasto(request.getIdCirculoGasto());
        gasto.setIdCategoria(request.getIdCategoria());
        return gastoRepository.save(gasto);
    }

    @Transactional
    public Optional<Gasto> update(Long id, GastoRequest request) {
        return gastoRepository.findById(id).map(gasto -> {
            gasto.setNombre(request.getNombre());
            gasto.setValor(request.getValor());
            gasto.setPeriodicidad(request.getPeriodicidad());
            gasto.setFechaInicio(request.getFechaInicio());
            gasto.setFechaFin(request.getFechaFin());
            gasto.setIdCategoria(request.getIdCategoria());
            return gastoRepository.save(gasto);
        });
    }

    @Transactional
    public void delete(Long id) {
        gastoRepository.deleteById(id);
    }
}