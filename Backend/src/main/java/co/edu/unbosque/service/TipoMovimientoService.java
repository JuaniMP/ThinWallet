package co.edu.unbosque.service;

import co.edu.unbosque.entity.TipoMovimiento;
import co.edu.unbosque.repository.TipoMovimientoRepository;
import co.edu.unbosque.request.TipoMovimientoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class TipoMovimientoService {

    private final TipoMovimientoRepository tipoMovimientoRepository;

    @Transactional(readOnly = true)
    public List<TipoMovimiento> findAll() {
        return tipoMovimientoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<TipoMovimiento> findById(Long id) {
        return tipoMovimientoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<TipoMovimiento> findByNombre(String nombre) {
        return tipoMovimientoRepository.findByNombre(nombre);
    }

    @Transactional
    public TipoMovimiento create(TipoMovimientoRequest request) {
        TipoMovimiento tipoMovimiento = new TipoMovimiento();
        tipoMovimiento.setNombre(request.getNombre());
        return tipoMovimientoRepository.save(tipoMovimiento);
    }

    @Transactional
    public void delete(Long id) {
        tipoMovimientoRepository.deleteById(id);
    }
}