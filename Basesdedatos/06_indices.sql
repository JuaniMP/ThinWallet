-- ===========================================================================
-- RNF-05 — Índices para optimización de latencia
-- Sin alterar columnas: solo CREATE INDEX sobre tablas existentes.
-- MySQL crea índices automáticamente para PK y FK; añadimos los compuestos
-- y los de columnas no-FK consultadas con frecuencia.
-- ---------------------------------------------------------------------------
-- Estrategia:
--   * Cada índice usa el patrón DROP + CREATE para que el script sea idempotente.
--   * Composite indexes priorizan los filtros más selectivos primero.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- transaccion
-- ---------------------------------------------------------------------------

-- Listado por usuario ordenado cronológicamente (Dashboard, Reportes).
DROP INDEX IF EXISTS idx_trx_usuario_fecha ON transaccion;
CREATE INDEX idx_trx_usuario_fecha
    ON transaccion (id_usuario, fecha_ejecucion DESC);

-- Filtro por círculo (movimientos del grupo).
DROP INDEX IF EXISTS idx_trx_circulo_fecha ON transaccion;
CREATE INDEX idx_trx_circulo_fecha
    ON transaccion (id_circulo_gasto, fecha_ejecucion DESC);

-- Filtro por tipo de movimiento (INGRESO/EGRESO) — usado por coach financiero.
DROP INDEX IF EXISTS idx_trx_tipo_mov ON transaccion;
CREATE INDEX idx_trx_tipo_mov
    ON transaccion (id_tipo_movimiento);

-- Filtro por estado (soft delete o histórico).
DROP INDEX IF EXISTS idx_trx_estado ON transaccion;
CREATE INDEX idx_trx_estado
    ON transaccion (estado);

-- ---------------------------------------------------------------------------
-- deuda
-- ---------------------------------------------------------------------------

-- Deudas pendientes por deudor (vista "Mis deudas").
DROP INDEX IF EXISTS idx_deuda_deudor_estado ON deuda;
CREATE INDEX idx_deuda_deudor_estado
    ON deuda (id_usuario_deudor, estado_pago);

-- Deudas que me deben (vista "Por cobrar").
DROP INDEX IF EXISTS idx_deuda_acreedor_estado ON deuda;
CREATE INDEX idx_deuda_acreedor_estado
    ON deuda (id_usuario_acreedor, estado_pago);

-- Filtro por fecha de creación.
DROP INDEX IF EXISTS idx_deuda_fecha ON deuda;
CREATE INDEX idx_deuda_fecha
    ON deuda (fecha_creacion DESC);

-- ---------------------------------------------------------------------------
-- auditoria_sistema
-- ---------------------------------------------------------------------------

-- Búsqueda histórica por usuario en rango temporal (sp_reporte_auditoria).
DROP INDEX IF EXISTS idx_audit_usuario_fecha ON auditoria_sistema;
CREATE INDEX idx_audit_usuario_fecha
    ON auditoria_sistema (id_usuario, fecha_accion DESC);

-- Búsqueda por tabla afectada + acción (filtros de admin).
DROP INDEX IF EXISTS idx_audit_tabla_accion ON auditoria_sistema;
CREATE INDEX idx_audit_tabla_accion
    ON auditoria_sistema (tabla_afectada, accion);

-- ---------------------------------------------------------------------------
-- usuario
-- ---------------------------------------------------------------------------

-- Login con token de reclamo y unión a círculo por token.
DROP INDEX IF EXISTS idx_usuario_token_reclamo ON usuario;
CREATE INDEX idx_usuario_token_reclamo
    ON usuario (token_reclamo);

-- Filtro por estado (activo/inactivo) y tipo de usuario.
DROP INDEX IF EXISTS idx_usuario_estado_tipo ON usuario;
CREATE INDEX idx_usuario_estado_tipo
    ON usuario (estado, id_tipo_usuario);

-- Búsqueda por nombre_usuario en buscadores.
DROP INDEX IF EXISTS idx_usuario_nombre_usuario ON usuario;
CREATE INDEX idx_usuario_nombre_usuario
    ON usuario (nombre_usuario);

-- ---------------------------------------------------------------------------
-- usuario_circulo
-- ---------------------------------------------------------------------------

-- Listado inverso: dado un usuario, sus círculos.
DROP INDEX IF EXISTS idx_uc_usuario ON usuario_circulo;
CREATE INDEX idx_uc_usuario
    ON usuario_circulo (id_usuario);

-- Listado de miembros por círculo (ya cubierto por PK, pero útil filtrar por rol).
DROP INDEX IF EXISTS idx_uc_circulo_rol ON usuario_circulo;
CREATE INDEX idx_uc_circulo_rol
    ON usuario_circulo (id_circulo_gasto, rol_usuario);

-- ---------------------------------------------------------------------------
-- gasto (gastos programados / metas)
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_gasto_creador_periodicidad ON gasto;
CREATE INDEX idx_gasto_creador_periodicidad
    ON gasto (id_usuario_creador, periodicidad);

DROP INDEX IF EXISTS idx_gasto_circulo ON gasto;
CREATE INDEX idx_gasto_circulo
    ON gasto (id_circulo_gasto);

-- ---------------------------------------------------------------------------
-- Verificación
-- ---------------------------------------------------------------------------
SELECT
    TABLE_NAME AS tabla,
    INDEX_NAME AS indice,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columnas
FROM   INFORMATION_SCHEMA.STATISTICS
WHERE  TABLE_SCHEMA = DATABASE()
  AND  INDEX_NAME LIKE 'idx_%'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;
