package co.edu.unbosque.repository;

import co.edu.unbosque.document.CategoriaDocument;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio MongoDB para categorías. Activo solo con spring.profiles.active=mongo.
 */
@Repository
@Profile("mongo")
public interface CategoriaMongoRepository extends MongoRepository<CategoriaDocument, String> {
    Optional<CategoriaDocument> findByIdCategoria(Long idCategoria);
    List<CategoriaDocument> findByIdCirculoGasto(Long idCirculoGasto);
    void deleteByIdCategoria(Long idCategoria);
}
