package co.edu.unbosque.service;

import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.request.TransaccionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionRepository transaccionRepository;

    @Transactional(readOnly = true)
    public List<Transaccion> findAll() {
        return transaccionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Transaccion> findById(Long id) {
        return transaccionRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Transaccion> findByUsuario(Long idUsuario) {
        return transaccionRepository.findByIdUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<Transaccion> findByCirculoGasto(Long idCirculoGasto) {
        return transaccionRepository.findByIdCirculoGasto(idCirculoGasto);
    }

    @Transactional
    public Transaccion create(TransaccionRequest request) {
        Transaccion transaccion = new Transaccion();
        transaccion.setNombre(request.getNombre());
        transaccion.setMontoOriginal(request.getMontoOriginal());
        transaccion.setMonedaOriginal(request.getMonedaOriginal());
        transaccion.setTasaCambio(request.getTasaCambio());
        transaccion.setTipoMovimiento(request.getTipoMovimiento());
        transaccion.setModalidadDivision(request.getModalidadDivision());
        transaccion.setContexto(request.getContexto());
        transaccion.setIdUsuario(request.getIdUsuario());
        transaccion.setIdCirculoGasto(request.getIdCirculoGasto());
        transaccion.setIdCategoria(request.getIdCategoria());
        transaccion.setIdGasto(request.getIdGasto());
        transaccion.setIdTipoMovimiento(request.getIdTipoMovimiento());
        return transaccionRepository.save(transaccion);
    }

    @Transactional
    public Optional<Transaccion> update(Long id, TransaccionRequest request) {
        return transaccionRepository.findById(id).map(transaccion -> {
            transaccion.setNombre(request.getNombre());
            transaccion.setMontoOriginal(request.getMontoOriginal());
            transaccion.setMonedaOriginal(request.getMonedaOriginal());
            transaccion.setTasaCambio(request.getTasaCambio());
            transaccion.setTipoMovimiento(request.getTipoMovimiento());
            transaccion.setModalidadDivision(request.getModalidadDivision());
            transaccion.setContexto(request.getContexto());
            transaccion.setIdTipoMovimiento(request.getIdTipoMovimiento());
            return transaccionRepository.save(transaccion);
        });
    }

    @Transactional
    public void delete(Long id) {
        transaccionRepository.deleteById(id);
    }
}