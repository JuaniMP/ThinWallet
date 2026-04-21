package co.edu.unbosque.repository;

import co.edu.unbosque.entity.TipoMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoMovimientoRepository extends JpaRepository<TipoMovimiento, Long> {
    Optional<TipoMovimiento> findByNombre(String nombre);
}