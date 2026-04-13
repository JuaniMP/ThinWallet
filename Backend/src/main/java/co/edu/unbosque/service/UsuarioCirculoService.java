package co.edu.unbosque.service;

import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.repository.UsuarioCirculoRepository;
import co.edu.unbosque.request.UsuarioCirculoRequest;
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
public class UsuarioCirculoService {

    private final UsuarioCirculoRepository usuarioCirculoRepository;

    @Transactional(readOnly = true)
    public List<UsuarioCirculo> findAll() {
        return usuarioCirculoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<UsuarioCirculo> findById(Long id) {
        return usuarioCirculoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<UsuarioCirculo> findByUsuario(Long idUsuario) {
        return usuarioCirculoRepository.findByIdUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioCirculo> findByCirculoGasto(Long idCirculoGasto) {
        return usuarioCirculoRepository.findByIdCirculoGasto(idCirculoGasto);
    }

    @Transactional
    public UsuarioCirculo create(UsuarioCirculoRequest request) {
        UsuarioCirculo uc = new UsuarioCirculo();
        uc.setIdUsuario(request.getIdUsuario());
        uc.setIdCirculoGasto(request.getIdCirculoGasto());
        uc.setRolUsuario(request.getRolUsuario());
        uc.setFechaIngreso(LocalDateTime.now());
        return usuarioCirculoRepository.save(uc);
    }

    @Transactional
    public Optional<UsuarioCirculo> update(Long id, UsuarioCirculoRequest request) {
        return usuarioCirculoRepository.findById(id).map(uc -> {
            uc.setRolUsuario(request.getRolUsuario());
            return usuarioCirculoRepository.save(uc);
        });
    }

    @Transactional
    public void delete(Long id) {
        usuarioCirculoRepository.deleteById(id);
    }
}