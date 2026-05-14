-- ============================================================================
-- THINWALLET — PROCEDIMIENTOS DE REPORTE Y CONSULTAS ANALYTICS
-- VERSIÓN PARA DBEAVER (sin DELIMITER)
-- 
-- INSTRUCCIONES:
-- En DBeaver, selecciona CADA bloque (desde DROP hasta END;)
-- y ejecútalo con Ctrl+Enter (o Cmd+Enter en Mac).
-- Ejecuta los bloques de ARRIBA hacia ABAJO, uno por uno.
-- EJECUTAR DESPUÉS de 01 y 02
-- ============================================================================

USE thinwallet_db;

-- ============================================================================
-- REPORTE 1: sp_reporte_estado_cuenta_mensual
-- Estado de cuenta por usuario (ingresos, egresos, categorías, gastos hormiga)
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_reporte_estado_cuenta_mensual;

CREATE PROCEDURE sp_reporte_estado_cuenta_mensual(
    IN p_id_usuario INT,
    IN p_mes        INT,
    IN p_anio       INT
)
BEGIN
    -- Datos del usuario
    SELECT CONCAT(nombres, ' ', apellidos) AS nombre,
           correo,
           DATE_FORMAT(fecha_registro, '%d/%m/%Y') AS miembro_desde
    FROM   usuario
    WHERE  id_usuario = p_id_usuario;

    -- Ingresos del mes (usando tipo_movimiento table)
    SELECT 'INGRESOS' AS concepto,
           COUNT(*)   AS cantidad,
           COALESCE(SUM(t.monto_original), 0) AS total
    FROM   transaccion t
    INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
    WHERE  t.id_usuario = p_id_usuario
      AND  UPPER(tm.nombre) IN ('DEPOSITO','INGRESO')
    UNION ALL
    SELECT 'EGRESOS',
           COUNT(*),
           COALESCE(SUM(t.monto_original), 0)
    FROM   transaccion t
    INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
    WHERE  t.id_usuario = p_id_usuario
      AND  UPPER(tm.nombre) IN ('RETIRO','GASTO','EGRESO');

    -- Transacciones por categoría (egresos)
    SELECT c.nombre AS categoria,
           COUNT(*) AS cantidad,
           ROUND(SUM(t.monto_original), 2) AS total
    FROM   transaccion t
    INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
    LEFT  JOIN categoria c ON t.id_categoria = c.id_categoria
    WHERE  t.id_usuario = p_id_usuario
      AND  UPPER(tm.nombre) IN ('RETIRO','GASTO','EGRESO')
    GROUP BY c.id_categoria, c.nombre
    ORDER BY SUM(t.monto_original) DESC;

    -- Gastos hormiga (monto <= 10000)
    SELECT c.nombre AS categoria,
           COUNT(*) AS cantidad_micro_gastos,
           ROUND(SUM(t.monto_original), 2) AS total_acumulado
    FROM   transaccion t
    INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
    LEFT  JOIN categoria c ON t.id_categoria = c.id_categoria
    WHERE  t.id_usuario     = p_id_usuario
      AND  t.id_circulo_gasto IS NULL
      AND  UPPER(tm.nombre) IN ('RETIRO','GASTO','EGRESO')
      AND  t.monto_original <= 10000
    GROUP BY c.id_categoria, c.nombre
    ORDER BY SUM(t.monto_original) DESC;
END;

-- ============================================================================
-- REPORTE 2: sp_reporte_analisis_circulo
-- Análisis completo de un círculo de gasto
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_reporte_analisis_circulo;

CREATE PROCEDURE sp_reporte_analisis_circulo(
    IN p_id_circulo INT
)
BEGIN
    -- Info del círculo
    SELECT cg.nombre,
           cg.moneda_base,
           cg.estado,
           CONCAT(u.nombres, ' ', u.apellidos) AS administrador,
           DATE_FORMAT(cg.fecha_creacion, '%d/%m/%Y') AS creado
    FROM   circulo_gasto cg
    LEFT  JOIN usuario u ON cg.id_usuario_creador = u.id_usuario
    WHERE  cg.id_circulo_gasto = p_id_circulo;

    -- Miembros con su deuda pendiente
    SELECT CONCAT(u.nombres, ' ', u.apellidos) AS miembro,
           uc.rol_usuario,
           ROUND(fn_calcular_deuda_usuario(u.id_usuario, p_id_circulo), 2) AS deuda_pendiente,
           COUNT(DISTINCT t.id_transaccion) AS transacciones
    FROM   usuario_circulo uc
    INNER JOIN usuario u ON uc.id_usuario = u.id_usuario
    LEFT  JOIN transaccion t ON t.id_usuario = u.id_usuario
               AND t.id_circulo_gasto = p_id_circulo
    WHERE  uc.id_circulo_gasto = p_id_circulo
    GROUP BY u.id_usuario, u.nombres, u.apellidos, uc.rol_usuario
    ORDER BY fn_calcular_deuda_usuario(u.id_usuario, p_id_circulo) DESC;

    -- Resumen de estados de deuda
    SELECT d.estado_pago,
           COUNT(*) AS cantidad,
           ROUND(SUM(d.monto), 2) AS monto_total
    FROM   deuda d
    INNER JOIN transaccion t ON d.id_transaccion = t.id_transaccion
    WHERE  t.id_circulo_gasto = p_id_circulo
    GROUP BY d.estado_pago
    ORDER BY COUNT(*) DESC;

    -- Top 10 categorías por gasto
    SELECT c.nombre AS categoria,
           COUNT(*) AS cantidad,
           ROUND(SUM(t.monto_original), 2) AS total
    FROM   transaccion t
    INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
    LEFT  JOIN categoria c ON t.id_categoria = c.id_categoria
    WHERE  t.id_circulo_gasto = p_id_circulo
      AND  UPPER(tm.nombre) IN ('RETIRO','GASTO','EGRESO')
    GROUP BY c.id_categoria, c.nombre
    ORDER BY SUM(t.monto_original) DESC
    LIMIT 10;

    -- Indicadores de salud
    SELECT ROUND(fn_tasa_friccion_circulo(p_id_circulo), 4) AS tasa_friccion,
           (SELECT COUNT(DISTINCT id_usuario) FROM usuario_circulo
            WHERE id_circulo_gasto = p_id_circulo) AS total_miembros,
           (SELECT COUNT(*) FROM transaccion
            WHERE id_circulo_gasto = p_id_circulo) AS total_transacciones;
END;

-- ============================================================================
-- REPORTE 3: sp_reporte_deudores_pendientes
-- Lista deudores pendientes de un círculo
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_reporte_deudores_pendientes;

CREATE PROCEDURE sp_reporte_deudores_pendientes(
    IN p_id_circulo INT
)
BEGIN
    SELECT d.id_deuda,
           CONCAT(ud.nombres, ' ', ud.apellidos) AS deudor,
           CONCAT(ua.nombres, ' ', ua.apellidos) AS acreedor,
           ROUND(d.monto, 2) AS monto,
           DATEDIFF(NOW(), d.fecha_creacion) AS dias_pendiente,
           d.estado_pago,
           d.metodo_pago_sugerido
    FROM   deuda d
    INNER JOIN transaccion t  ON d.id_transaccion    = t.id_transaccion
    LEFT  JOIN usuario ud     ON d.id_usuario_deudor  = ud.id_usuario
    LEFT  JOIN usuario ua     ON d.id_usuario_acreedor = ua.id_usuario
    WHERE  t.id_circulo_gasto = p_id_circulo
      AND  d.estado_pago IN ('PENDIENTE','CONFIRMADA_PENDIENTE')
    ORDER BY d.fecha_creacion ASC;
END;

-- ============================================================================
-- REPORTE 4: sp_reporte_auditoria
-- Auditoría y trazabilidad (filtra por fechas y opcionalmente por usuario)
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_reporte_auditoria;

CREATE PROCEDURE sp_reporte_auditoria(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin    DATE,
    IN p_id_usuario   INT   -- NULL = todos los usuarios
)
BEGIN
    SELECT a.id_auditoria,
           CONCAT(u.nombres, ' ', u.apellidos) AS usuario,
           a.tabla_afectada,
           a.accion,
           DATE_FORMAT(a.fecha_accion, '%d/%m/%Y %H:%i:%s') AS fecha,
           a.valores_anteriores,
           a.valores_nuevos
    FROM   auditoria_sistema a
    LEFT  JOIN usuario u ON a.id_usuario = u.id_usuario
    WHERE  DATE(a.fecha_accion) BETWEEN p_fecha_inicio AND p_fecha_fin
      AND  (p_id_usuario IS NULL OR a.id_usuario = p_id_usuario)
    ORDER BY a.fecha_accion DESC;
END;

-- ============================================================================
-- REPORTE 5: sp_reporte_historial_pagos
-- Historial de pagos de un usuario en un rango de fechas
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_reporte_historial_pagos;

CREATE PROCEDURE sp_reporte_historial_pagos(
    IN p_id_usuario   INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin    DATE
)
BEGIN
    SELECT d.id_deuda,
           CONCAT(ua.nombres, ' ', ua.apellidos) AS acreedor,
           cg.nombre AS circulo,
           ROUND(d.monto, 2) AS monto,
           d.metodo_pago_sugerido AS metodo_pago,
           d.estado_pago,
           DATE_FORMAT(d.fecha_creacion,   '%d/%m/%Y') AS fecha_creacion,
           DATE_FORMAT(d.fecha_pago,       '%d/%m/%Y') AS fecha_pago,
           DATE_FORMAT(d.fecha_confirmada, '%d/%m/%Y') AS fecha_confirmada
    FROM   deuda d
    INNER JOIN transaccion t   ON d.id_transaccion    = t.id_transaccion
    LEFT  JOIN circulo_gasto cg ON t.id_circulo_gasto  = cg.id_circulo_gasto
    LEFT  JOIN usuario ua       ON d.id_usuario_acreedor = ua.id_usuario
    WHERE  d.id_usuario_deudor = p_id_usuario
      AND  DATE(d.fecha_creacion) BETWEEN p_fecha_inicio AND p_fecha_fin
    ORDER BY d.fecha_creacion DESC;
END;

-- ============================================================================
-- CONSULTAS ANALYTICS REUTILIZABLES (ejecutar directamente, reemplazar ? por valores)
-- ============================================================================

-- Evolución de gastos por tipo de movimiento (reemplaza ? por id_usuario):
-- SELECT UPPER(tm.nombre) AS tipo, COUNT(*) AS cantidad, SUM(t.monto_original) AS total
-- FROM transaccion t
-- INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
-- WHERE t.id_usuario = ?
-- GROUP BY tm.id_tipo_movimiento, tm.nombre
-- ORDER BY SUM(t.monto_original) DESC;

-- Miembros más deudores en un círculo (reemplaza ? por id_circulo):
-- SELECT CONCAT(u.nombres,' ',u.apellidos) AS miembro,
--        ROUND(SUM(d.monto),2) AS deuda_total,
--        COUNT(*) AS cantidad_deudas
-- FROM deuda d
-- INNER JOIN usuario u ON d.id_usuario_deudor = u.id_usuario
-- INNER JOIN transaccion t ON d.id_transaccion = t.id_transaccion
-- WHERE t.id_circulo_gasto = ? AND d.estado_pago IN ('PENDIENTE','CONFIRMADA_PENDIENTE')
-- GROUP BY d.id_usuario_deudor, u.nombres, u.apellidos
-- ORDER BY SUM(d.monto) DESC;

-- Tasa de cobranza por círculo:
-- SELECT cg.nombre AS circulo,
--        COUNT(CASE WHEN d.estado_pago='PAGADA' THEN 1 END) AS pagadas,
--        COUNT(CASE WHEN d.estado_pago='PENDIENTE' THEN 1 END) AS pendientes,
--        ROUND(COUNT(CASE WHEN d.estado_pago='PAGADA' THEN 1 END)/COUNT(*)*100,2) AS tasa_pct
-- FROM deuda d
-- INNER JOIN transaccion t ON d.id_transaccion = t.id_transaccion
-- LEFT JOIN circulo_gasto cg ON t.id_circulo_gasto = cg.id_circulo_gasto
-- GROUP BY cg.id_circulo_gasto, cg.nombre
-- ORDER BY tasa_pct DESC;

SELECT 'Reportes creados exitosamente' AS resultado;
