package co.edu.unbosque.repository;

import co.edu.unbosque.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByIdCirculoGasto(Long idCirculoGasto);
    List<Categoria> findByExclusivaPerfilSolo(Boolean exclusivaPerfilSolo);
}