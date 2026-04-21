package co.edu.unbosque.service;

import co.edu.unbosque.entity.Categoria;
import co.edu.unbosque.repository.CategoriaRepository;
import co.edu.unbosque.request.CategoriaRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Transactional(readOnly = true)
    public List<Categoria> findAll() {
        return categoriaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Categoria> findById(Long id) {
        return categoriaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Categoria> findByCirculoGasto(Long idCirculoGasto) {
        return categoriaRepository.findByIdCirculoGasto(idCirculoGasto);
    }

    @Transactional
    public Categoria create(CategoriaRequest request) {
        Categoria categoria = new Categoria();
        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setTipoCategoria(request.getTipoCategoria());
        categoria.setExclusivaPerfilSolo(request.getExclusivaPerfilSolo());
        categoria.setFrecuenciaUso(request.getFrecuenciaUso());
        categoria.setIdCirculoGasto(request.getIdCirculoGasto());
        categoria.setEstado(1);
        return categoriaRepository.save(categoria);
    }

    @Transactional
    public Optional<Categoria> update(Long id, CategoriaRequest request) {
        return categoriaRepository.findById(id).map(categoria -> {
            categoria.setNombre(request.getNombre());
            categoria.setDescripcion(request.getDescripcion());
            categoria.setTipoCategoria(request.getTipoCategoria());
            categoria.setExclusivaPerfilSolo(request.getExclusivaPerfilSolo());
            categoria.setFrecuenciaUso(request.getFrecuenciaUso());
            return categoriaRepository.save(categoria);
        });
    }

    @Transactional
    public void delete(Long id) {
        categoriaRepository.deleteById(id);
    }
}