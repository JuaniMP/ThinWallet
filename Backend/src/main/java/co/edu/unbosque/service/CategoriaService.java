package co.edu.unbosque.service;

import co.edu.unbosque.entity.Categoria;
import co.edu.unbosque.request.CategoriaRequest;
import co.edu.unbosque.store.ICategoriaStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoriaService {

    private final ICategoriaStore categoriaStore;

    public List<Categoria> findAll() {
        return categoriaStore.findAll();
    }

    public Optional<Categoria> findById(Long id) {
        return categoriaStore.findById(id);
    }

    public List<Categoria> findByCirculoGasto(Long idCirculoGasto) {
        return categoriaStore.findByIdCirculoGasto(idCirculoGasto);
    }

    public Categoria create(CategoriaRequest request) {
        Categoria categoria = new Categoria();
        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setTipoCategoria(request.getTipoCategoria());
        categoria.setExclusivaPerfilSolo(request.getExclusivaPerfilSolo());
        categoria.setFrecuenciaUso(request.getFrecuenciaUso());
        categoria.setIdCirculoGasto(request.getIdCirculoGasto());
        categoria.setEstado(1);
        return categoriaStore.save(categoria);
    }

    public Optional<Categoria> update(Long id, CategoriaRequest request) {
        return categoriaStore.findById(id).map(categoria -> {
            categoria.setNombre(request.getNombre());
            categoria.setDescripcion(request.getDescripcion());
            categoria.setTipoCategoria(request.getTipoCategoria());
            categoria.setExclusivaPerfilSolo(request.getExclusivaPerfilSolo());
            categoria.setFrecuenciaUso(request.getFrecuenciaUso());
            return categoriaStore.save(categoria);
        });
    }

    public void delete(Long id) {
        categoriaStore.deleteById(id);
    }
}
