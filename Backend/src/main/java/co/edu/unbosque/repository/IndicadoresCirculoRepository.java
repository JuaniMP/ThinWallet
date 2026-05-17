package co.edu.unbosque.repository;

import co.edu.unbosque.document.IndicadoresCirculo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IndicadoresCirculoRepository extends MongoRepository<IndicadoresCirculo, String> {

    Optional<IndicadoresCirculo> findByIdCirculo(Long idCirculo);

    boolean existsByIdCirculo(Long idCirculo);
}
