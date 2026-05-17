package co.edu.unbosque.store;

import co.edu.unbosque.document.CategoriaDocument;
import co.edu.unbosque.entity.Categoria;
import co.edu.unbosque.repository.CategoriaMongoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementación NoSQL (MongoDB) activa cuando spring.profiles.active=mongo.
 * Para conectar: configurar spring.data.mongodb.uri en application-mongo.properties.
 */
@Component
@Profile("mongo")
@RequiredArgsConstructor
public class CategoriaMongoStore implements ICategoriaStore {

    private final CategoriaMongoRepository mongoRepository;

    @Override
    public List<Categoria> findAll() {
        return mongoRepository.findAll().stream()
                .map(this::toCategoria)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Categoria> findById(Long id) {
        return mongoRepository.findByIdCategoria(id)
                .map(this::toCategoria);
    }

    @Override
    public List<Categoria> findByIdCirculoGasto(Long idCirculoGasto) {
        return mongoRepository.findByIdCirculoGasto(idCirculoGasto).stream()
                .map(this::toCategoria)
                .collect(Collectors.toList());
    }

    @Override
    public Categoria save(Categoria categoria) {
        CategoriaDocument doc = toDocument(categoria);
        if (doc.getIdCategoria() == null) {
            // En MongoDB no hay auto-increment nativo: usamos timestamp como ID numérico temporal.
            // En producción reemplaza esto por una secuencia real (ej. @GeneratedValue con mongock).
            doc.setIdCategoria(System.currentTimeMillis());
        }
        CategoriaDocument saved = mongoRepository.save(doc);
        return toCategoria(saved);
    }

    @Override
    public void deleteById(Long id) {
        mongoRepository.deleteByIdCategoria(id);
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private Categoria toCategoria(CategoriaDocument doc) {
        Categoria c = new Categoria();
        c.setIdCategoria(doc.getIdCategoria());
        c.setNombre(doc.getNombre());
        c.setDescripcion(doc.getDescripcion());
        c.setTipoCategoria(doc.getTipoCategoria());
        c.setExclusivaPerfilSolo(doc.getExclusivaPerfilSolo());
        c.setFrecuenciaUso(doc.getFrecuenciaUso());
        c.setEstado(doc.getEstado());
        c.setIdCirculoGasto(doc.getIdCirculoGasto());
        return c;
    }

    private CategoriaDocument toDocument(Categoria c) {
        CategoriaDocument doc = new CategoriaDocument();
        doc.setIdCategoria(c.getIdCategoria());
        doc.setNombre(c.getNombre());
        doc.setDescripcion(c.getDescripcion());
        doc.setTipoCategoria(c.getTipoCategoria());
        doc.setExclusivaPerfilSolo(c.getExclusivaPerfilSolo());
        doc.setFrecuenciaUso(c.getFrecuenciaUso());
        doc.setEstado(c.getEstado());
        doc.setIdCirculoGasto(c.getIdCirculoGasto());
        return doc;
    }
}
