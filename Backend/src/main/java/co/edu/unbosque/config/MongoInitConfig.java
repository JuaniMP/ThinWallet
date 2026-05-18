package co.edu.unbosque.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Inicializa colecciones e índices en gestion_gastos_audit al arrancar (async).
 * Idempotente: solo crea si no existen. No bloquea el startup.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class MongoInitConfig implements ApplicationRunner {

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(ApplicationArguments args) {
        initializeAsync();
    }

    @Async
    private void initializeAsync() {
        try {
            inicializarColecciones();
            inicializarIndices();
            log.info("MongoDB [gestion_gastos_audit] – colecciones e índices listos");
        } catch (Exception e) {
            log.warn("MongoDB – no disponible al iniciar: {}", e.getMessage());
        }
    }

    private void inicializarColecciones() {
        crearSiNoExiste("actividad_circulo_diaria");
        crearSiNoExiste("indicadores_circulo");
    }

    private void crearSiNoExiste(String nombre) {
        if (!mongoTemplate.collectionExists(nombre)) {
            mongoTemplate.createCollection(nombre);
            log.info("MongoDB – colección '{}' creada", nombre);
        }
    }

    private void inicializarIndices() {
        // ── actividad_circulo_diaria ─────────────────────────────────────────

        mongoTemplate.indexOps("actividad_circulo_diaria").ensureIndex(
                new CompoundIndexDefinition(
                        new org.bson.Document("id_circulo", 1).append("fecha_bucket", -1))
                        .named("idx_circulo_fecha"));

        mongoTemplate.indexOps("actividad_circulo_diaria").ensureIndex(
                new CompoundIndexDefinition(
                        new org.bson.Document("id_circulo", 1)
                                .append("fecha_bucket", 1)
                                .append("total_eventos", 1))
                        .named("idx_bucket_busqueda"));

        mongoTemplate.indexOps("actividad_circulo_diaria").ensureIndex(
                new CompoundIndexDefinition(
                        new org.bson.Document("eventos.tipo_evento", 1)
                                .append("eventos.timestamp", -1))
                        .named("idx_tipo_evento_timestamp"));

        mongoTemplate.indexOps("actividad_circulo_diaria").ensureIndex(
                new Index("eventos.id_usuario", Sort.Direction.ASC)
                        .named("idx_usuario_eventos"));

        // ── indicadores_circulo ──────────────────────────────────────────────

        mongoTemplate.indexOps("indicadores_circulo").ensureIndex(
                new Index("id_circulo", Sort.Direction.ASC)
                        .unique()
                        .named("idx_circulo_unico"));

        mongoTemplate.indexOps("indicadores_circulo").ensureIndex(
                new Index("ultima_actualizacion", Sort.Direction.DESC)
                        .named("idx_ultima_actualizacion"));

        log.info("MongoDB – índices verificados/creados en gestion_gastos_audit");
    }
}
