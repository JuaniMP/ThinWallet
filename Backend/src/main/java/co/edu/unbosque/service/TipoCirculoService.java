package co.edu.unbosque.service;

import co.edu.unbosque.entity.TipoCirculo;
import co.edu.unbosque.repository.TipoCirculoRepository;
import co.edu.unbosque.request.TipoCirculoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class TipoCirculoService {

    private final TipoCirculoRepository tipoCirculoRepository;

    @Transactional(readOnly = true)
    public List<TipoCirculo> findAll() {
        return tipoCirculoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<TipoCirculo> findById(Long id) {
        return tipoCirculoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<TipoCirculo> findByNombre(String nombre) {
        return tipoCirculoRepository.findByNombre(nombre);
    }

    @Transactional
    public TipoCirculo create(TipoCirculoRequest request) {
        TipoCirculo tipoCirculo = new TipoCirculo();
        tipoCirculo.setNombre(request.getNombre());
        return tipoCirculoRepository.save(tipoCirculo);
    }

    @Transactional
    public void delete(Long id) {
        tipoCirculoRepository.deleteById(id);
    }
}