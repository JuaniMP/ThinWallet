package co.edu.unbosque.service;

import co.edu.unbosque.entity.Deuda;
import co.edu.unbosque.repository.DeudaRepository;
import co.edu.unbosque.request.DeudaRequest;
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
public class DeudaService {

    private final DeudaRepository deudaRepository;

    @Transactional(readOnly = true)
    public List<Deuda> findAll() {
        return deudaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Deuda> findById(Long id) {
        return deudaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByUsuarioDeudor(Long idUsuarioDeudor) {
        return deudaRepository.findByIdUsuarioDeudor(idUsuarioDeudor);
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByUsuarioAcreedor(Long idUsuarioAcreedor) {
        return deudaRepository.findByIdUsuarioAcreedor(idUsuarioAcreedor);
    }

    @Transactional(readOnly = true)
    public List<Deuda> findByTransaccion(Long idTransaccion) {
        return deudaRepository.findByIdTransaccion(idTransaccion);
    }

    @Transactional
    public Deuda create(DeudaRequest request) {
        Deuda deuda = new Deuda();
        deuda.setMonto(request.getMonto());
        deuda.setMetodoPagoSugerido(request.getMetodoPagoSugerido());
        deuda.setPorcentajeDivision(request.getPorcentajeDivision());
        deuda.setEstadoPago(request.getEstadoPago());
        deuda.setIdTransaccion(request.getIdTransaccion());
        deuda.setIdUsuarioDeudor(request.getIdUsuarioDeudor());
        deuda.setIdUsuarioAcreedor(request.getIdUsuarioAcreedor());
        deuda.setFechaCreacion(LocalDateTime.now());
        return deudaRepository.save(deuda);
    }

    @Transactional
    public Optional<Deuda> update(Long id, DeudaRequest request) {
        return deudaRepository.findById(id).map(deuda -> {
            deuda.setMonto(request.getMonto());
            deuda.setMetodoPagoSugerido(request.getMetodoPagoSugerido());
            deuda.setPorcentajeDivision(request.getPorcentajeDivision());
            deuda.setEstadoPago(request.getEstadoPago());
            return deudaRepository.save(deuda);
        });
    }

    @Transactional
    public Optional<Deuda> confirmarPago(Long id) {
        return deudaRepository.findById(id).map(deuda -> {
            deuda.setEstadoPago("CONFIRMADO");
            deuda.setFechaConfirmada(LocalDateTime.now());
            return deudaRepository.save(deuda);
        });
    }

    @Transactional
    public void delete(Long id) {
        deudaRepository.deleteById(id);
    }
}