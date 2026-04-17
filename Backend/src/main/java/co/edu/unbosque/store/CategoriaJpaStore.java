package co.edu.unbosque.store;

import co.edu.unbosque.entity.Categoria;
import co.edu.unbosque.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementación SQL (MySQL/H2) activa cuando spring.profiles.active=sql.
 */
@Component
@Profile("sql")
@RequiredArgsConstructor
public class CategoriaJpaStore implements ICategoriaStore {

    private final CategoriaRepository categoriaRepository;

    @Override
    public List<Categoria> findAll() {
        return categoriaRepository.findAll();
    }

    @Override
    public Optional<Categoria> findById(Long id) {
        return categoriaRepository.findById(id);
    }

    @Override
    public List<Categoria> findByIdCirculoGasto(Long idCirculoGasto) {
        return categoriaRepository.findByIdCirculoGasto(idCirculoGasto);
    }

    @Override
    public Categoria save(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    @Override
    public void deleteById(Long id) {
        categoriaRepository.deleteById(id);
    }
}
