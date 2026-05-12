package co.edu.unbosque.repository;

import co.edu.unbosque.document.ActividadCirculoDiaria;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActividadCirculoDiariaRepository extends MongoRepository<ActividadCirculoDiaria, String> {

    /** Primer bucket del día con espacio disponible (< límite) */
    Optional<ActividadCirculoDiaria> findFirstByIdCirculoAndFechaBucketAndTotalEventosLessThan(
            Long idCirculo, LocalDate fechaBucket, int limite);

    List<ActividadCirculoDiaria> findByIdCirculoAndFechaBucketGreaterThanEqual(
            Long idCirculo, LocalDate desde);

    List<ActividadCirculoDiaria> findByIdCirculoAndFechaBucket(
            Long idCirculo, LocalDate fechaBucket);

    List<ActividadCirculoDiaria> findByIdCirculo(Long idCirculo);

    /** Para encontrar el bucket_seq máximo del día */
    Optional<ActividadCirculoDiaria> findFirstByIdCirculoAndFechaBucketOrderByBucketSeqDesc(
            Long idCirculo, LocalDate fechaBucket);
}
