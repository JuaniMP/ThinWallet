package co.edu.unbosque.service;

import co.edu.unbosque.document.ActividadCirculoDiaria;
import co.edu.unbosque.document.ActividadCirculoDiaria.EventoCirculo;
import co.edu.unbosque.document.IndicadoresCirculo;
import co.edu.unbosque.document.IndicadoresCirculo.*;
import co.edu.unbosque.repository.ActividadCirculoDiariaRepository;
import co.edu.unbosque.repository.IndicadoresCirculoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Gestión de actividad de círculos en MongoDB.
 *
 * Patrón Bucket:       agrupa hasta 500 eventos por círculo/día en un solo documento.
 * Patrón Approximation: recalcula indicadores cada 10 eventos, no en cada inserción.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ActividadCirculoService {

    private static final int MAX_EVENTOS_BUCKET = 500;

    private final ActividadCirculoDiariaRepository actividadRepo;
    private final IndicadoresCirculoRepository indicadoresRepo;
    private final MongoTemplate mongoTemplate;

    // ── API pública ───────────────────────────────────────────────────────────

    /**
     * Registra un evento de negocio en el bucket del día y actualiza los indicadores.
     * Punto de entrada principal desde los demás servicios SQL.
     *
     * <p>Se ejecuta en un hilo separado para que un MongoDB lento o caído
     * NUNCA bloquee la respuesta del endpoint que lo invocó. Si Mongo demora
     * 30s en hacer timeout, el usuario no se entera.
     */
    public void registrarEvento(Long idCirculo, String tipoEvento, Long idUsuario,
                                Map<String, Object> contexto) {
        if (idCirculo == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                guardarEnBucket(idCirculo, tipoEvento, idUsuario, contexto);
                actualizarIndicadores(idCirculo, tipoEvento);
            } catch (Exception e) {
                log.warn("MongoDB – error registrando evento {} para circulo {}: {}",
                        tipoEvento, idCirculo, e.getMessage());
            }
        });
    }

    /** Indicadores actuales del círculo (dashboard del líder). */
    public Optional<IndicadoresCirculo> getIndicadores(Long idCirculo) {
        return indicadoresRepo.findByIdCirculo(idCirculo);
    }

    /** Buckets de actividad de hoy. */
    public List<ActividadCirculoDiaria> getActividadHoy(Long idCirculo) {
        return actividadRepo.findByIdCirculoAndFechaBucket(idCirculo, LocalDate.now());
    }

    /** Tipos de eventos más frecuentes en los últimos N días. */
    public List<Map<String, Object>> getEventosFrecuentes(Long idCirculo, int dias) {
        LocalDate desde = LocalDate.now().minusDays(dias);
        return agregarPorTipoEvento(idCirculo, desde);
    }

    /** Miembro con más acciones en los últimos N días. */
    public Map<String, Object> getMiembroMasActivo(Long idCirculo, int dias) {
        LocalDate desde = LocalDate.now().minusDays(dias);
        List<Map<String, Object>> ranking = agregarPorUsuario(idCirculo, desde);
        return ranking.isEmpty() ? Map.of() : ranking.get(0);
    }

    /** Transacciones por día en los últimos N días. */
    public List<Map<String, Object>> getEvolucionTransacciones(Long idCirculo, int dias) {
        LocalDate desde = LocalDate.now().minusDays(dias);
        return agregarEvolucionTransacciones(idCirculo, desde);
    }

    // ── Patrón Bucket ─────────────────────────────────────────────────────────

    private void guardarEnBucket(Long idCirculo, String tipoEvento, Long idUsuario,
                                 Map<String, Object> contexto) {
        LocalDate hoy = LocalDate.now();

        EventoCirculo evento = new EventoCirculo();
        evento.setTipoEvento(tipoEvento);
        evento.setIdUsuario(idUsuario);
        evento.setTimestamp(LocalDateTime.now());
        evento.setContexto(contexto != null ? contexto : Map.of());

        // Buscar bucket del día con espacio
        Optional<ActividadCirculoDiaria> bucketOpt =
                actividadRepo.findFirstByIdCirculoAndFechaBucketAndTotalEventosLessThan(
                        idCirculo, hoy, MAX_EVENTOS_BUCKET);

        ActividadCirculoDiaria bucket;
        if (bucketOpt.isPresent()) {
            bucket = bucketOpt.get();
        } else {
            // Bucket lleno o no existe → crear uno nuevo con seq incremental
            int siguienteSeq = actividadRepo
                    .findFirstByIdCirculoAndFechaBucketOrderByBucketSeqDesc(idCirculo, hoy)
                    .map(b -> (b.getBucketSeq() != null ? b.getBucketSeq() : 0) + 1)
                    .orElse(0);

            bucket = new ActividadCirculoDiaria();
            bucket.setIdCirculo(idCirculo);
            bucket.setFechaBucket(hoy);
            bucket.setBucketSeq(siguienteSeq);
            bucket.setTotalEventos(0);
            bucket.setEventos(new ArrayList<>());
            bucket.setCreadoEn(LocalDateTime.now());
        }

        bucket.getEventos().add(evento);
        bucket.setTotalEventos(bucket.getTotalEventos() + 1);
        actividadRepo.save(bucket);
    }

    // ── Patrón Approximation ──────────────────────────────────────────────────

    private void actualizarIndicadores(Long idCirculo, String tipoEvento) {
        IndicadoresCirculo ind = indicadoresRepo.findByIdCirculo(idCirculo)
                .orElseGet(() -> crearIndicadoresIniciales(idCirculo));

        Contadores c = ind.getContadores();
        c.setEventosSinPersistir(c.getEventosSinPersistir() + 1);

        switch (tipoEvento) {
            case "TRANSACCION_REALIZADA"    -> c.setTotalTransacciones(c.getTotalTransacciones() + 1);
            case "DEUDA_GENERADA"           -> c.setTotalDeudasGeneradas(c.getTotalDeudasGeneradas() + 1);
            case "DEUDA_PAGADA"             -> c.setTotalDeudasPagadas(c.getTotalDeudasPagadas() + 1);
            case "DEUDA_RECHAZADA"          -> c.setTotalDeudasRechazadas(c.getTotalDeudasRechazadas() + 1);
            case "GASTO_PROGRAMADO_CREADO"  -> c.setTotalGastosProgramados(c.getTotalGastosProgramados() + 1);
            case "MESADA_ENVIADA"           -> c.setTotalMesadasEnviadas(c.getTotalMesadasEnviadas() + 1);
            case "MIEMBRO_INVITADO"         -> c.setTotalMiembrosInvitados(c.getTotalMiembrosInvitados() + 1);
            case "MIEMBRO_EXPULSADO"        -> c.setTotalMiembrosExpulsados(c.getTotalMiembrosExpulsados() + 1);
        }

        ind.setUltimaActualizacion(LocalDateTime.now());
        indicadoresRepo.save(ind);

        // Approximation: recalcular métricas complejas solo cada N eventos
        if (c.getEventosSinPersistir() >= ind.getUmbralPersistencia()) {
            recalcularIndicadores(ind);
        }
    }

    /** Recálculo completo de métricas. Se ejecuta solo al alcanzar el umbral. */
    private void recalcularIndicadores(IndicadoresCirculo ind) {
        Long idCirculo = ind.getIdCirculo();
        Contadores c = ind.getContadores();

        // Tasa de fricción: deudas rechazadas / deudas generadas
        double tasaFriccion = c.getTotalDeudasGeneradas() > 0
                ? (double) c.getTotalDeudasRechazadas() / c.getTotalDeudasGeneradas()
                : 0.0;

        TasaFriccion tf = new TasaFriccion();
        tf.setValor(Math.round(tasaFriccion * 100.0) / 100.0);
        tf.setEtiqueta(tasaFriccion > 0.30 ? "ALTO" : tasaFriccion > 0.15 ? "MEDIO" : "BAJO");
        tf.setDescripcion("% de deudas rechazadas vs generadas");

        // Nivel de actividad: transacciones en los últimos 30 días (desde MongoDB)
        int totalRecientes = contarTransaccionesRecientes(idCirculo, 30);

        NivelActividad na = new NivelActividad();
        na.setTransaccionesMes(totalRecientes);
        if (totalRecientes > 20)      na.setValor("MUY_ACTIVO");
        else if (totalRecientes > 10) na.setValor("ACTIVO");
        else if (totalRecientes > 0)  na.setValor("POCO_ACTIVO");
        else                          na.setValor("DORMIDO");
        na.setDescripcion("Estado del círculo basado en transacciones recientes");

        // Salud del círculo (0-100)
        double puntuacion = 100.0;
        puntuacion -= tasaFriccion * 30;
        if ("DORMIDO".equals(na.getValor()))       puntuacion -= 40;
        else if ("POCO_ACTIVO".equals(na.getValor())) puntuacion -= 20;
        int deudaPendiente = c.getTotalDeudasGeneradas() - c.getTotalDeudasPagadas();
        if (deudaPendiente > 0) puntuacion -= Math.min(deudaPendiente * 2, 20);
        puntuacion = Math.max(0, Math.min(100, puntuacion));

        SaludCirculo sc = new SaludCirculo();
        sc.setPuntuacion((int) Math.round(puntuacion));
        sc.setEtiqueta(puntuacion < 40 ? "CRITICO" : puntuacion < 60 ? "REGULAR" : puntuacion < 80 ? "BUENO" : "EXCELENTE");
        sc.setDescripcion("Índice combinado de actividad y pagos");

        IndicadoresDetalle detalle = new IndicadoresDetalle();
        detalle.setTasaFriccion(tf);
        detalle.setNivelActividad(na);
        detalle.setSaludCirculo(sc);

        c.setEventosSinPersistir(0);
        ind.setIndicadores(detalle);
        ind.setContadores(c);
        ind.setUltimaActualizacion(LocalDateTime.now());
        indicadoresRepo.save(ind);

        log.info("MongoDB – indicadores recalculados para circulo {} | salud={} nivel={}",
                idCirculo, sc.getEtiqueta(), na.getValor());
    }

    // ── Aggregations ──────────────────────────────────────────────────────────

    private int contarTransaccionesRecientes(Long idCirculo, int dias) {
        LocalDate desde = LocalDate.now().minusDays(dias);
        try {
            MatchOperation matchBucket = Aggregation.match(
                    Criteria.where("id_circulo").is(idCirculo)
                            .and("fecha_bucket").gte(desde));
            UnwindOperation unwind = Aggregation.unwind("eventos");
            MatchOperation matchEvento = Aggregation.match(
                    Criteria.where("eventos.tipo_evento").is("TRANSACCION_REALIZADA"));
            CountOperation count = Aggregation.count().as("total");

            AggregationResults<Map> results = mongoTemplate.aggregate(
                    Aggregation.newAggregation(matchBucket, unwind, matchEvento, count),
                    "actividad_circulo_diaria", Map.class);

            List<Map> mapped = results.getMappedResults();
            if (mapped.isEmpty()) return 0;
            Object total = mapped.get(0).get("total");
            return total instanceof Number ? ((Number) total).intValue() : 0;
        } catch (Exception e) {
            log.warn("MongoDB – error aggregation contarTransacciones circulo {}: {}", idCirculo, e.getMessage());
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> agregarPorTipoEvento(Long idCirculo, LocalDate desde) {
        try {
            MatchOperation matchBucket = Aggregation.match(
                    Criteria.where("id_circulo").is(idCirculo)
                            .and("fecha_bucket").gte(desde));
            UnwindOperation unwind = Aggregation.unwind("eventos");
            GroupOperation group = Aggregation.group("eventos.tipo_evento").count().as("cantidad");
            SortOperation sort = Aggregation.sort(
                    org.springframework.data.domain.Sort.by(
                            org.springframework.data.domain.Sort.Direction.DESC, "cantidad"));
            LimitOperation limit = Aggregation.limit(8);

            AggregationResults<Map> results = mongoTemplate.aggregate(
                    Aggregation.newAggregation(matchBucket, unwind, group, sort, limit),
                    "actividad_circulo_diaria", Map.class);

            List<Map<String, Object>> lista = new ArrayList<>();
            for (Map m : results.getMappedResults()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("tipo_evento", m.get("_id"));
                item.put("cantidad", m.get("cantidad"));
                lista.add(item);
            }
            return lista;
        } catch (Exception e) {
            log.warn("MongoDB – error aggregation tipoEvento circulo {}: {}", idCirculo, e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> agregarPorUsuario(Long idCirculo, LocalDate desde) {
        try {
            MatchOperation matchBucket = Aggregation.match(
                    Criteria.where("id_circulo").is(idCirculo)
                            .and("fecha_bucket").gte(desde));
            UnwindOperation unwind = Aggregation.unwind("eventos");
            GroupOperation group = Aggregation.group("eventos.id_usuario").count().as("acciones");
            SortOperation sort = Aggregation.sort(
                    org.springframework.data.domain.Sort.by(
                            org.springframework.data.domain.Sort.Direction.DESC, "acciones"));
            LimitOperation limit = Aggregation.limit(5);

            AggregationResults<Map> results = mongoTemplate.aggregate(
                    Aggregation.newAggregation(matchBucket, unwind, group, sort, limit),
                    "actividad_circulo_diaria", Map.class);

            List<Map<String, Object>> lista = new ArrayList<>();
            for (Map m : results.getMappedResults()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id_usuario", m.get("_id"));
                item.put("acciones", m.get("acciones"));
                lista.add(item);
            }
            return lista;
        } catch (Exception e) {
            log.warn("MongoDB – error aggregation miembroActivo circulo {}: {}", idCirculo, e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> agregarEvolucionTransacciones(Long idCirculo, LocalDate desde) {
        try {
            MatchOperation matchBucket = Aggregation.match(
                    Criteria.where("id_circulo").is(idCirculo)
                            .and("fecha_bucket").gte(desde));
            UnwindOperation unwind = Aggregation.unwind("eventos");
            MatchOperation matchEvento = Aggregation.match(
                    Criteria.where("eventos.tipo_evento").is("TRANSACCION_REALIZADA"));
            GroupOperation group = Aggregation.group("fecha_bucket").count().as("cantidad");
            SortOperation sort = Aggregation.sort(
                    org.springframework.data.domain.Sort.by(
                            org.springframework.data.domain.Sort.Direction.ASC, "_id"));

            AggregationResults<Map> results = mongoTemplate.aggregate(
                    Aggregation.newAggregation(matchBucket, unwind, matchEvento, group, sort),
                    "actividad_circulo_diaria", Map.class);

            List<Map<String, Object>> lista = new ArrayList<>();
            for (Map m : results.getMappedResults()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("fecha", m.get("_id"));
                item.put("cantidad", m.get("cantidad"));
                lista.add(item);
            }
            return lista;
        } catch (Exception e) {
            log.warn("MongoDB – error aggregation evolucion circulo {}: {}", idCirculo, e.getMessage());
            return List.of();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private IndicadoresCirculo crearIndicadoresIniciales(Long idCirculo) {
        IndicadoresCirculo ind = new IndicadoresCirculo();
        ind.setIdCirculo(idCirculo);
        ind.setContadores(new Contadores());
        ind.setIndicadores(new IndicadoresDetalle());
        ind.setCategoriasMasUsadas(new ArrayList<>());
        ind.setUmbralPersistencia(10);
        ind.setCreadoEn(LocalDateTime.now());
        ind.setUltimaActualizacion(LocalDateTime.now());
        return indicadoresRepo.save(ind);
    }
}
