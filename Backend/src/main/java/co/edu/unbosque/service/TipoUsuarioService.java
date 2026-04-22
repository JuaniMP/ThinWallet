package co.edu.unbosque.service;

import co.edu.unbosque.entity.TipoUsuario;
import co.edu.unbosque.repository.TipoUsuarioRepository;
import co.edu.unbosque.request.TipoUsuarioRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class TipoUsuarioService {

    private final TipoUsuarioRepository tipoUsuarioRepository;

    @Transactional(readOnly = true)
    public List<TipoUsuario> findAll() {
        return tipoUsuarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<TipoUsuario> findById(Long id) {
        return tipoUsuarioRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<TipoUsuario> findByNombre(String nombre) {
        return tipoUsuarioRepository.findByNombre(nombre);
    }

    @Transactional
    public TipoUsuario create(TipoUsuarioRequest request) {
        TipoUsuario tipoUsuario = new TipoUsuario();
        // Asignación manual del ID (Ej: 1 para Admin, 2 para Usuario)
        tipoUsuario.setIdTipoUsuario(request.getIdTipoUsuario()); 
        tipoUsuario.setNombre(request.getNombre());
        return tipoUsuarioRepository.save(tipoUsuario);
    }

    @Transactional
    public void delete(Long id) {
        tipoUsuarioRepository.deleteById(id);
    }
}