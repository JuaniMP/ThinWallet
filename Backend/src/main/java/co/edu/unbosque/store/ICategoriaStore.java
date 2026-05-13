package co.edu.unbosque.store;

import co.edu.unbosque.entity.Categoria;

import java.util.List;
import java.util.Optional;

/**
 * Abstracción del almacenamiento de categorías.
 * Implementaciones: CategoriaJpaStore (SQL) y CategoriaMongoStore (NoSQL).
 * Para cambiar de motor basta con cambiar spring.profiles.active en application.properties.
 */
public interface ICategoriaStore {
    List<Categoria> findAll();
    Optional<Categoria> findById(Long id);
    List<Categoria> findByIdCirculoGasto(Long idCirculoGasto);
    Categoria save(Categoria categoria);
    void deleteById(Long id);
}
