package co.edu.unbosque.repository;

import co.edu.unbosque.entity.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GastoRepository extends JpaRepository<Gasto, Long> {
    List<Gasto> findByIdUsuarioCreador(Long idUsuarioCreador);
    List<Gasto> findByIdCirculoGasto(Long idCirculoGasto);
    List<Gasto> findByIdCategoria(Long idCategoria);
}