-- ============================================================================
-- THINWALLET — FUNCIONES Y PROCEDIMIENTOS ALMACENADOS
-- VERSIÓN PARA DBEAVER (sin DELIMITER)
-- 
-- INSTRUCCIONES:
-- En DBeaver, selecciona CADA bloque CREATE (desde DROP hasta el END;)
-- y ejecútalo con Ctrl+Enter (o Cmd+Enter en Mac).
-- Ejecuta los bloques de ARRIBA hacia ABAJO, uno por uno.
-- ============================================================================

USE thinwallet_db;

-- ============================================================================
-- FUNCIÓN 1: fn_convertir_moneda
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP FUNCTION IF EXISTS fn_convertir_moneda;

CREATE FUNCTION fn_convertir_moneda(
    p_monto      DECIMAL(15,2),
    p_tasa_cambio DECIMAL(10,4)
)
RETURNS DECIMAL(15,2)
DETERMINISTIC
BEGIN
    IF p_tasa_cambio IS NULL OR p_tasa_cambio <= 0 THEN
        RETURN p_monto;
    END IF;
    RETURN ROUND(p_monto * p_tasa_cambio, 2);
END;

-- ============================================================================
-- FUNCIÓN 2: fn_calcular_deuda_usuario
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP FUNCTION IF EXISTS fn_calcular_deuda_usuario;

CREATE FUNCTION fn_calcular_deuda_usuario(
    p_id_usuario INT,
    p_id_circulo INT
)
RETURNS DECIMAL(15,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(15,2) DEFAULT 0;
    SELECT COALESCE(SUM(d.monto), 0)
    INTO   v_total
    FROM   deuda d
    INNER JOIN transaccion t ON d.id_transaccion = t.id_transaccion
    WHERE  d.id_usuario_deudor   = p_id_usuario
      AND  t.id_circulo_gasto    = p_id_circulo
      AND  d.estado_pago IN ('PENDIENTE','CONFIRMADA_PENDIENTE');
    RETURN v_total;
END;

-- ============================================================================
-- FUNCIÓN 3: fn_tasa_friccion_circulo
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP FUNCTION IF EXISTS fn_tasa_friccion_circulo;

CREATE FUNCTION fn_tasa_friccion_circulo(
    p_id_circulo INT
)
RETURNS DECIMAL(5,4)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total     INT DEFAULT 0;
    DECLARE v_rechazadas INT DEFAULT 0;

    SELECT COUNT(*) INTO v_total
    FROM   deuda d
    INNER JOIN transaccion t ON d.id_transaccion = t.id_transaccion
    WHERE  t.id_circulo_gasto = p_id_circulo;

    SELECT COUNT(*) INTO v_rechazadas
    FROM   deuda d
    INNER JOIN transaccion t ON d.id_transaccion = t.id_transaccion
    WHERE  t.id_circulo_gasto = p_id_circulo
      AND  d.estado_pago = 'RECHAZADA';

    IF v_total = 0 THEN RETURN 0; END IF;
    RETURN ROUND(v_rechazadas / v_total, 4);
END;

-- ============================================================================
-- FUNCIÓN 4: fn_contar_gastos_hormiga
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP FUNCTION IF EXISTS fn_contar_gastos_hormiga;

CREATE FUNCTION fn_contar_gastos_hormiga(
    p_id_usuario   INT,
    p_umbral_monto DECIMAL(15,2),
    p_dias         INT
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_cantidad INT DEFAULT 0;
    SELECT COUNT(*)
    INTO   v_cantidad
    FROM   transaccion t
    INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
    WHERE  t.id_usuario        = p_id_usuario
      AND  t.id_circulo_gasto  IS NULL
      AND  UPPER(tm.nombre)    IN ('RETIRO','GASTO','EGRESO')
      AND  t.monto_original   <= p_umbral_monto;
    RETURN v_cantidad;
END;

-- ============================================================================
-- FUNCIÓN 5: fn_balance_usuario_periodo
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP FUNCTION IF EXISTS fn_balance_usuario_periodo;

CREATE FUNCTION fn_balance_usuario_periodo(
    p_id_usuario   INT,
    p_fecha_inicio DATE,
    p_fecha_fin    DATE
)
RETURNS DECIMAL(15,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_ingresos DECIMAL(15,2) DEFAULT 0;
    DECLARE v_egresos  DECIMAL(15,2) DEFAULT 0;

    -- Ingresos: categorías de tipo DEPOSITO/INGRESO en el rango de fechas
    SELECT COALESCE(SUM(t.monto_original),0)
    INTO   v_ingresos
    FROM   transaccion t
    INNER JOIN categoria c ON t.id_categoria = c.id_categoria
    WHERE  t.id_usuario = p_id_usuario
      AND  DATE(t.fecha_ejecucion) BETWEEN p_fecha_inicio AND p_fecha_fin
      AND  UPPER(c.tipo_categoria) IN ('DEPOSITO','INGRESO');

    -- Egresos: categorías de tipo RETIRO/GASTO/EGRESO en el rango de fechas
    SELECT COALESCE(SUM(t.monto_original),0)
    INTO   v_egresos
    FROM   transaccion t
    INNER JOIN categoria c ON t.id_categoria = c.id_categoria
    WHERE  t.id_usuario = p_id_usuario
      AND  DATE(t.fecha_ejecucion) BETWEEN p_fecha_inicio AND p_fecha_fin
      AND  UPPER(c.tipo_categoria) IN ('RETIRO','GASTO','EGRESO');

    RETURN ROUND(v_ingresos - v_egresos, 2);
END;

-- ============================================================================
-- PROCEDIMIENTO 1: sp_crear_transaccion
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_crear_transaccion;

CREATE PROCEDURE sp_crear_transaccion(
    IN  p_nombre           VARCHAR(255),
    IN  p_id_usuario       INT,
    IN  p_id_circulo       INT,
    IN  p_monto            DECIMAL(15,2),
    IN  p_id_categoria     INT,
    IN  p_id_tipo_movimiento INT,
    IN  p_modalidad        VARCHAR(50),
    IN  p_moneda_original  VARCHAR(10),
    IN  p_tasa_cambio      DECIMAL(10,4),
    IN  p_contexto         VARCHAR(255),
    OUT p_id_transaccion   INT,
    OUT p_mensaje          VARCHAR(500),
    OUT p_resultado        INT
)
main: BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 0;
        SET p_mensaje   = 'Error: transacción revertida por excepción';
    END;

    IF p_monto <= 0 THEN
        SET p_resultado = 0;
        SET p_mensaje   = 'El monto debe ser mayor a 0';
        LEAVE main;
    END IF;

    IF p_id_circulo IS NOT NULL AND
       NOT EXISTS (SELECT 1 FROM circulo_gasto WHERE id_circulo_gasto = p_id_circulo) THEN
        SET p_resultado = 0;
        SET p_mensaje   = 'Círculo de gasto no existe';
        LEAVE main;
    END IF;

    START TRANSACTION;

    INSERT INTO transaccion (
        nombre, monto_original, moneda_original, tasa_cambio,
        modalidad_division, contexto,
        id_usuario, id_circulo_gasto, id_categoria, id_tipo_movimiento
    ) VALUES (
        p_nombre,
        fn_convertir_moneda(p_monto, p_tasa_cambio),
        p_moneda_original,
        p_tasa_cambio,
        p_modalidad,
        p_contexto,
        p_id_usuario,
        p_id_circulo,
        p_id_categoria,
        p_id_tipo_movimiento
    );

    SET p_id_transaccion = LAST_INSERT_ID();

    -- Dividir deudas si es transacción en círculo
    IF p_id_circulo IS NOT NULL THEN
        CALL sp_calcular_deudas(p_id_transaccion, p_modalidad, p_id_usuario, p_id_circulo, p_monto);
    END IF;

    COMMIT;
    SET p_resultado = 1;
    SET p_mensaje   = CONCAT('Transacción creada. ID: ', p_id_transaccion);
END;

-- ============================================================================
-- PROCEDIMIENTO 2: sp_calcular_deudas
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_calcular_deudas;

CREATE PROCEDURE sp_calcular_deudas(
    IN p_id_transaccion INT,
    IN p_modalidad      VARCHAR(50),
    IN p_id_acreedor    INT,
    IN p_id_circulo     INT,
    IN p_monto_total    DECIMAL(15,2)
)
main: BEGIN
    DECLARE v_id_miembro       INT;
    DECLARE v_cantidad_miembros INT DEFAULT 0;
    DECLARE v_monto_por_persona DECIMAL(15,2);
    DECLARE done               INT DEFAULT 0;

    DECLARE cur_miembros CURSOR FOR
        SELECT id_usuario
        FROM   usuario_circulo
        WHERE  id_circulo_gasto = p_id_circulo
          AND  id_usuario != p_id_acreedor;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    SELECT COUNT(*) INTO v_cantidad_miembros
    FROM   usuario_circulo
    WHERE  id_circulo_gasto = p_id_circulo
      AND  id_usuario != p_id_acreedor;

    IF v_cantidad_miembros = 0 THEN
        LEAVE main;
    END IF;

    SET v_monto_por_persona = ROUND(p_monto_total / (v_cantidad_miembros + 1), 2);

    OPEN cur_miembros;
    loop_miembros: LOOP
        FETCH cur_miembros INTO v_id_miembro;
        IF done THEN LEAVE loop_miembros; END IF;

        INSERT INTO deuda (
            monto, porcentaje_division, estado_pago,
            fecha_creacion, id_transaccion,
            id_usuario_deudor, id_usuario_acreedor
        ) VALUES (
            v_monto_por_persona,
            ROUND((v_monto_por_persona / p_monto_total) * 100, 2),
            'PENDIENTE',
            NOW(),
            p_id_transaccion,
            v_id_miembro,
            p_id_acreedor
        );
    END LOOP loop_miembros;
    CLOSE cur_miembros;
END;

-- ============================================================================
-- PROCEDIMIENTO 3: sp_pagar_deuda
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_pagar_deuda;

CREATE PROCEDURE sp_pagar_deuda(
    IN  p_id_deuda    INT,
    IN  p_metodo_pago VARCHAR(50),
    OUT p_resultado   INT,
    OUT p_mensaje     VARCHAR(500)
)
main: BEGIN
    DECLARE v_estado VARCHAR(50);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 0;
        SET p_mensaje   = 'Error al procesar pago';
    END;

    SELECT estado_pago INTO v_estado FROM deuda WHERE id_deuda = p_id_deuda;

    IF v_estado IS NULL THEN
        SET p_resultado = 0; SET p_mensaje = 'Deuda no encontrada'; LEAVE main;
    END IF;

    IF v_estado != 'PENDIENTE' THEN
        SET p_resultado = 0; SET p_mensaje = 'La deuda no está en estado PENDIENTE'; LEAVE main;
    END IF;

    START TRANSACTION;
    UPDATE deuda
    SET    estado_pago = 'CONFIRMADA_PENDIENTE',
           metodo_pago_sugerido = p_metodo_pago,
           fecha_pago = NOW()
    WHERE  id_deuda = p_id_deuda;
    COMMIT;

    SET p_resultado = 1;
    SET p_mensaje   = 'Pago registrado. Pendiente confirmación del acreedor.';
END;

-- ============================================================================
-- PROCEDIMIENTO 4: sp_confirmar_pago_deuda
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_confirmar_pago_deuda;

CREATE PROCEDURE sp_confirmar_pago_deuda(
    IN  p_id_deuda  INT,
    OUT p_resultado INT,
    OUT p_mensaje   VARCHAR(500)
)
main: BEGIN
    DECLARE v_estado VARCHAR(50);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 0;
        SET p_mensaje   = 'Error al confirmar pago';
    END;

    SELECT estado_pago INTO v_estado FROM deuda WHERE id_deuda = p_id_deuda;

    IF v_estado IS NULL THEN
        SET p_resultado = 0; SET p_mensaje = 'Deuda no encontrada'; LEAVE main;
    END IF;

    IF v_estado != 'CONFIRMADA_PENDIENTE' THEN
        SET p_resultado = 0; SET p_mensaje = 'La deuda no está pendiente de confirmación'; LEAVE main;
    END IF;

    START TRANSACTION;
    UPDATE deuda
    SET    estado_pago = 'PAGADA',
           fecha_confirmada = NOW()
    WHERE  id_deuda = p_id_deuda;
    COMMIT;

    SET p_resultado = 1;
    SET p_mensaje   = 'Pago confirmado exitosamente.';
END;

-- ============================================================================
-- PROCEDIMIENTO 5: sp_cerrar_ciclo_mensual
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_cerrar_ciclo_mensual;

CREATE PROCEDURE sp_cerrar_ciclo_mensual(
    IN  p_id_circulo INT,
    IN  p_mes        INT,
    IN  p_anio       INT,
    OUT p_resultado  INT,
    OUT p_mensaje    VARCHAR(500)
)
main: BEGIN
    DECLARE v_deudas_pendientes INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 0;
        SET p_mensaje   = 'Error al cerrar ciclo';
    END;

    SELECT COUNT(*) INTO v_deudas_pendientes
    FROM   deuda d
    INNER JOIN transaccion t ON d.id_transaccion = t.id_transaccion
    WHERE  t.id_circulo_gasto = p_id_circulo
      AND  d.estado_pago = 'PENDIENTE';

    IF v_deudas_pendientes > 0 THEN
        SET p_resultado = 0;
        SET p_mensaje   = CONCAT('Hay ', v_deudas_pendientes, ' deudas PENDIENTE sin resolver. Resuelve antes de cerrar.');
        LEAVE main;
    END IF;

    START TRANSACTION;
    -- Registrar cierre en auditoría
    INSERT INTO auditoria_sistema (
        id_usuario, tabla_afectada, registro_id, accion,
        valores_nuevos, fecha_accion
    ) VALUES (
        NULL, 'circulo_gasto', p_id_circulo, 'CIERRE_CICLO',
        JSON_OBJECT('mes', p_mes, 'anio', p_anio, 'deudas_pendientes', 0),
        NOW()
    );
    COMMIT;

    SET p_resultado = 1;
    SET p_mensaje   = CONCAT('Ciclo ', p_mes, '/', p_anio, ' del círculo ', p_id_circulo, ' cerrado exitosamente.');
END;

-- ============================================================================
-- PROCEDIMIENTO 6: sp_asignar_mesada
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_asignar_mesada;

CREATE PROCEDURE sp_asignar_mesada(
    IN  p_id_circulo  INT,
    IN  p_id_miembro  INT,
    IN  p_monto       DECIMAL(15,2),
    IN  p_periodo     VARCHAR(50),
    IN  p_id_admin    INT,
    OUT p_resultado   INT,
    OUT p_mensaje     VARCHAR(500)
)
main: BEGIN
    DECLARE v_es_admin      INT DEFAULT 0;
    DECLARE v_existe_miembro INT DEFAULT 0;
    DECLARE v_id_categoria  INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 0;
        SET p_mensaje   = 'Error al asignar mesada';
    END;

    SELECT COUNT(*) INTO v_es_admin
    FROM circulo_gasto
    WHERE id_circulo_gasto = p_id_circulo AND id_usuario_creador = p_id_admin;

    IF v_es_admin = 0 THEN
        SET p_resultado = 0; SET p_mensaje = 'No tienes permisos para asignar mesadas'; LEAVE main;
    END IF;

    SELECT COUNT(*) INTO v_existe_miembro
    FROM usuario_circulo
    WHERE id_circulo_gasto = p_id_circulo AND id_usuario = p_id_miembro;

    IF v_existe_miembro = 0 THEN
        SET p_resultado = 0; SET p_mensaje = 'El usuario no es miembro de este círculo'; LEAVE main;
    END IF;

    -- Buscar categoría "Mesada" o usar la primera disponible
    SELECT id_categoria INTO v_id_categoria FROM categoria WHERE nombre = 'Mesada' LIMIT 1;
    IF v_id_categoria IS NULL THEN
        SELECT MIN(id_categoria) INTO v_id_categoria FROM categoria;
    END IF;

    START TRANSACTION;
    INSERT INTO gasto (nombre, valor, periodicidad, fecha_inicio,
                       id_usuario_creador, id_circulo_gasto, id_categoria)
    VALUES (
        CONCAT('Mesada para usuario ', p_id_miembro),
        p_monto,
        p_periodo,
        NOW(),
        p_id_admin,
        p_id_circulo,
        v_id_categoria
    );
    COMMIT;

    SET p_resultado = 1;
    SET p_mensaje   = 'Mesada asignada exitosamente.';
END;

-- ============================================================================
-- PROCEDIMIENTO 7: sp_reclamar_perfil_fantasma
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_reclamar_perfil_fantasma;

CREATE PROCEDURE sp_reclamar_perfil_fantasma(
    IN  p_token_reclamo       VARCHAR(255),
    IN  p_nombres             VARCHAR(100),
    IN  p_apellidos           VARCHAR(100),
    IN  p_nombre_usuario      VARCHAR(100),
    IN  p_correo              VARCHAR(150),
    IN  p_nueva_contrasena_hash VARCHAR(255),
    OUT p_resultado           INT,
    OUT p_mensaje             VARCHAR(500)
)
main: BEGIN
    DECLARE v_id_usuario INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 0;
        SET p_mensaje   = 'Error al reclamar perfil';
    END;

    SELECT id_usuario INTO v_id_usuario
    FROM usuario
    WHERE token_reclamo = p_token_reclamo AND id_tipo_usuario = 3
    LIMIT 1;

    IF v_id_usuario IS NULL THEN
        SET p_resultado = 0; SET p_mensaje = 'Token inválido o perfil ya reclamado'; LEAVE main;
    END IF;

    IF EXISTS (SELECT 1 FROM usuario WHERE correo = p_correo AND id_usuario != v_id_usuario) THEN
        SET p_resultado = 0; SET p_mensaje = 'El correo ya está en uso'; LEAVE main;
    END IF;

    IF EXISTS (SELECT 1 FROM usuario WHERE nombre_usuario = p_nombre_usuario AND id_usuario != v_id_usuario) THEN
        SET p_resultado = 0; SET p_mensaje = 'El nombre de usuario ya está en uso'; LEAVE main;
    END IF;

    START TRANSACTION;
    UPDATE usuario
    SET    nombres        = p_nombres,
           apellidos      = p_apellidos,
           nombre_usuario = p_nombre_usuario,
           correo         = p_correo,
           contrasena_hash = p_nueva_contrasena_hash,
           id_tipo_usuario = 2,
           estado          = 1,
           token_reclamo   = NULL
    WHERE  id_usuario = v_id_usuario;
    COMMIT;

    SET p_resultado = 1;
    SET p_mensaje   = CONCAT('Perfil reclamado. ID usuario: ', v_id_usuario);
END;

-- ----------------------------------------------------------------------------
-- FN 8: fn_recomendar_ahorro (variante DBeaver)
-- Calcula recomendación de ahorro 50/30/20 para un usuario.
-- Devuelve JSON con porcentajes objetivo, gastos reales y cumplimiento.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS fn_recomendar_ahorro;
CREATE FUNCTION fn_recomendar_ahorro(
    p_id_usuario      INT,
    p_ingreso_mensual DECIMAL(15,2)
)
RETURNS JSON
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_gastos        DECIMAL(15,2) DEFAULT 0;
    DECLARE v_necesidades   DECIMAL(15,2) DEFAULT 0;
    DECLARE v_deseos        DECIMAL(15,2) DEFAULT 0;
    DECLARE v_ahorro        DECIMAL(15,2) DEFAULT 0;
    DECLARE v_sobrante      DECIMAL(15,2) DEFAULT 0;
    DECLARE v_cumplimiento  DECIMAL(5,2)  DEFAULT 0;

    SET v_necesidades = ROUND(p_ingreso_mensual * 0.50, 2);
    SET v_deseos      = ROUND(p_ingreso_mensual * 0.30, 2);
    SET v_ahorro      = ROUND(p_ingreso_mensual * 0.20, 2);

    SELECT COALESCE(SUM(t.monto_original), 0)
    INTO   v_gastos
    FROM   transaccion t
    INNER JOIN tipo_movimiento tm ON t.id_tipo_movimiento = tm.id_tipo_movimiento
    WHERE  t.id_usuario   = p_id_usuario
      AND  UPPER(tm.nombre) IN ('RETIRO','GASTO','EGRESO');

    SET v_sobrante = p_ingreso_mensual - v_gastos;

    IF p_ingreso_mensual > 0 THEN
        SET v_cumplimiento = ROUND((v_sobrante / (p_ingreso_mensual * 0.20)) * 100, 2);
        IF v_cumplimiento < 0 THEN SET v_cumplimiento = 0; END IF;
        IF v_cumplimiento > 100 THEN SET v_cumplimiento = 100; END IF;
    END IF;

    RETURN JSON_OBJECT(
        'ingreso_mensual', p_ingreso_mensual,
        'necesidades_max', v_necesidades,
        'deseos_max',      v_deseos,
        'ahorro_objetivo', v_ahorro,
        'gastos_actuales', v_gastos,
        'sobrante',        v_sobrante,
        'cumplimiento',    v_cumplimiento
    );
END;

SELECT 'Funciones y Procedimientos creados exitosamente' AS resultado;
