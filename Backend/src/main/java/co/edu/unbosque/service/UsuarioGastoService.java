package co.edu.unbosque.service;

import co.edu.unbosque.entity.UsuarioGasto;
import co.edu.unbosque.repository.UsuarioGastoRepository;
import co.edu.unbosque.request.UsuarioGastoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class UsuarioGastoService {

    private final UsuarioGastoRepository usuarioGastoRepository;

    @Transactional(readOnly = true)
    public List<UsuarioGasto> findAll() {
        return usuarioGastoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<UsuarioGasto> findById(Long id) {
        return usuarioGastoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<UsuarioGasto> findByUsuario(Long idUsuario) {
        return usuarioGastoRepository.findByIdUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioGasto> findByGasto(Long idGasto) {
        return usuarioGastoRepository.findByIdGasto(idGasto);
    }

    @Transactional
    public UsuarioGasto create(UsuarioGastoRequest request) {
        UsuarioGasto ug = new UsuarioGasto();
        ug.setIdUsuario(request.getIdUsuario());
        ug.setIdGasto(request.getIdGasto());
        return usuarioGastoRepository.save(ug);
    }

    @Transactional
    public void delete(Long id) {
        usuarioGastoRepository.deleteById(id);
    }
}