package co.edu.unbosque.config;

import co.edu.unbosque.entity.Categoria;
import co.edu.unbosque.entity.TipoMovimiento;
import co.edu.unbosque.repository.CategoriaRepository;
import co.edu.unbosque.repository.TipoMovimientoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Siembra datos base en MySQL al arrancar.
 * Idempotente: solo inserta si no existen.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final TipoMovimientoRepository tipoMovimientoRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedTipoMovimiento("EFECTIVO");
        seedTipoMovimiento("TARJETA");
        seedTipoMovimiento("TRANSFERENCIA");
        seedCategoria("Cobro de deuda", "DEPOSITO");
        seedCategoria("Pago de deuda", "RETIRO");
        log.info("DataSeeder – datos base verificados");
    }

    private void seedTipoMovimiento(String nombre) {
        tipoMovimientoRepository.findByNombre(nombre).orElseGet(() -> {
            TipoMovimiento tm = new TipoMovimiento();
            tm.setNombre(nombre);
            TipoMovimiento saved = tipoMovimientoRepository.save(tm);
            log.info("DataSeeder – tipo de movimiento '{}' creado con id={}", nombre, saved.getIdTipoMovimiento());
            return saved;
        });
    }

    private void seedCategoria(String nombre, String tipoCategoria) {
        categoriaRepository.findByNombre(nombre).orElseGet(() -> {
            Categoria cat = new Categoria();
            cat.setNombre(nombre);
            cat.setTipoCategoria(tipoCategoria);
            cat.setExclusivaPerfilSolo(false);
            cat.setEstado(1);
            Categoria saved = categoriaRepository.save(cat);
            log.info("DataSeeder – categoría '{}' ({}) creada con id={}", nombre, tipoCategoria, saved.getIdCategoria());
            return saved;
        });
    }
}
