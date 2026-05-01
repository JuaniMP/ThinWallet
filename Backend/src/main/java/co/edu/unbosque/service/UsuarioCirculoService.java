package co.edu.unbosque.service;

import co.edu.unbosque.entity.UsuarioCirculo;
import co.edu.unbosque.entity.UsuarioCirculoId;
import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.entity.CirculoGasto;
import co.edu.unbosque.repository.UsuarioCirculoRepository;
import co.edu.unbosque.repository.UsuarioRepository;
import co.edu.unbosque.repository.CirculoGastoRepository;
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
    private final UsuarioRepository usuarioRepository;
    private final CirculoGastoRepository circuloGastoRepository;

    @Transactional(readOnly = true)
    public List<UsuarioCirculo> findAll() {
        return usuarioCirculoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<UsuarioCirculo> findById(Long idUsuario, Long idCirculoGasto) {
        UsuarioCirculoId id = new UsuarioCirculoId();
        id.setIdUsuario(idUsuario);
        id.setIdCirculoGasto(idCirculoGasto);
        return usuarioCirculoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<UsuarioCirculo> findByUsuario(Long idUsuario) {
        // Ajustado al nombre corregido en el Repository
        return usuarioCirculoRepository.findByUsuario_IdUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioCirculo> findByCirculoGasto(Long idCirculoGasto) {
        // Ajustado al nombre corregido en el Repository (idCirculoGasto)
        return usuarioCirculoRepository.findByCirculoGasto_IdCirculoGasto(idCirculoGasto);
    }

    @Transactional
    public UsuarioCirculo create(UsuarioCirculoRequest request) {
        UsuarioCirculo uc = new UsuarioCirculo();

        // CORRECCIÓN: Buscamos los objetos reales antes de setearlos
        Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        CirculoGasto circulo = circuloGastoRepository.findById(request.getIdCirculoGasto())
                .orElseThrow(() -> new RuntimeException("Círculo de gasto no encontrado"));

        UsuarioCirculoId id = new UsuarioCirculoId();
        id.setIdUsuario(request.getIdUsuario());
        id.setIdCirculoGasto(request.getIdCirculoGasto());
        uc.setId(id);
        uc.setUsuario(usuario);
        uc.setCirculoGasto(circulo);
        uc.setRolUsuario(request.getRolUsuario());

        // Usamos fechaIngreso, que corresponde al campo actual de la entidad
        uc.setFechaIngreso(LocalDateTime.now());

        return usuarioCirculoRepository.save(uc);
    }

    @Transactional
    public Optional<UsuarioCirculo> update(Long idUsuario, Long idCirculoGasto, UsuarioCirculoRequest request) {
        UsuarioCirculoId id = new UsuarioCirculoId();
        id.setIdUsuario(idUsuario);
        id.setIdCirculoGasto(idCirculoGasto);
        return usuarioCirculoRepository.findById(id).map(uc -> {
            uc.setRolUsuario(request.getRolUsuario());
            return usuarioCirculoRepository.save(uc);
        });
    }

    @Transactional
    public void delete(Long idUsuario, Long idCirculoGasto) {
        UsuarioCirculoId id = new UsuarioCirculoId();
        id.setIdUsuario(idUsuario);
        id.setIdCirculoGasto(idCirculoGasto);
        usuarioCirculoRepository.deleteById(id);
    }
}