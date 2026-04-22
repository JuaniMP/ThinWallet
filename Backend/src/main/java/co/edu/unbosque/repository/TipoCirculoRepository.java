package co.edu.unbosque.repository;

import co.edu.unbosque.entity.TipoCirculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoCirculoRepository extends JpaRepository<TipoCirculo, Long> {
    Optional<TipoCirculo> findByNombre(String nombre);
}