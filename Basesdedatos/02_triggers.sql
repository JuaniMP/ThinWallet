-- ============================================================================
-- THINWALLET — TRIGGERS
-- Corregido para el esquema real de thinwallet_db
-- Ejecutar DESPUÉS de 01_funciones_y_procedimientos.sql
-- ============================================================================

USE thinwallet_db;

-- ============================================================================
-- TRIGGERS: TABLA transaccion
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validar_transaccion_insert;
DELIMITER //
CREATE TRIGGER trg_validar_transaccion_insert
BEFORE INSERT ON transaccion
FOR EACH ROW
BEGIN
    IF NEW.monto_original <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El monto debe ser mayor a 0';
    END IF;
END//
DELIMITER ;

-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_auditoria_transaccion_update;
DELIMITER //
CREATE TRIGGER trg_auditoria_transaccion_update
AFTER UPDATE ON transaccion
FOR EACH ROW
BEGIN
    -- Auditar si cambia id_tipo_movimiento (cambio de tipo)
    IF OLD.id_tipo_movimiento <=> NEW.id_tipo_movimiento = 0 THEN
        INSERT INTO auditoria_sistema (
            id_usuario, tabla_afectada, registro_id, accion,
            valores_anteriores, valores_nuevos, fecha_accion
        ) VALUES (
            NEW.id_usuario, 'transaccion', NEW.id_transaccion, 'UPDATE',
            JSON_OBJECT('id_tipo_movimiento', OLD.id_tipo_movimiento, 'monto', OLD.monto_original),
            JSON_OBJECT('id_tipo_movimiento', NEW.id_tipo_movimiento, 'monto', NEW.monto_original),
            NOW()
        );
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- TRIGGERS: TABLA deuda
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_deuda_update;
DELIMITER //
CREATE TRIGGER trg_auditoria_deuda_update
AFTER UPDATE ON deuda
FOR EACH ROW
BEGIN
    IF OLD.estado_pago != NEW.estado_pago THEN
        INSERT INTO auditoria_sistema (
            id_usuario, tabla_afectada, registro_id, accion,
            valores_anteriores, valores_nuevos, fecha_accion
        ) VALUES (
            NEW.id_usuario_deudor, 'deuda', NEW.id_deuda, 'UPDATE',
            JSON_OBJECT('estado_pago', OLD.estado_pago, 'monto', OLD.monto),
            JSON_OBJECT('estado_pago', NEW.estado_pago, 'monto', NEW.monto,
                        'fecha_pago', NEW.fecha_pago,
                        'fecha_confirmada', NEW.fecha_confirmada),
            NOW()
        );
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- TRIGGERS: TABLA usuario_circulo
-- Bloquea la salida de un círculo si el usuario tiene deudas pendientes
-- ============================================================================

DROP TRIGGER IF EXISTS trg_bloquear_salida_con_deuda;
DELIMITER //
CREATE TRIGGER trg_bloquear_salida_con_deuda
BEFORE DELETE ON usuario_circulo
FOR EACH ROW
BEGIN
    DECLARE v_deuda DECIMAL(15,2) DEFAULT 0;

    SELECT COALESCE(SUM(d.monto), 0) INTO v_deuda
    FROM   deuda d
    INNER JOIN transaccion t ON d.id_transaccion = t.id_transaccion
    WHERE  d.id_usuario_deudor  = OLD.id_usuario
      AND  t.id_circulo_gasto   = OLD.id_circulo_gasto
      AND  d.estado_pago IN ('PENDIENTE', 'CONFIRMADA_PENDIENTE');

    IF v_deuda > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No puedes salir del círculo con deudas pendientes';
    END IF;
END//
DELIMITER ;

-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_auditoria_usuario_circulo_insert;
DELIMITER //
CREATE TRIGGER trg_auditoria_usuario_circulo_insert
AFTER INSERT ON usuario_circulo
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_sistema (
        id_usuario, tabla_afectada, registro_id, accion,
        valores_nuevos, fecha_accion
    ) VALUES (
        NEW.id_usuario, 'usuario_circulo', CONCAT(NEW.id_usuario, '_', NEW.id_circulo_gasto), 'INSERT',
        JSON_OBJECT('rol', NEW.rol_usuario, 'id_circulo', NEW.id_circulo_gasto),
        NOW()
    );
END//
DELIMITER ;

-- ============================================================================
-- TRIGGERS: TABLA circulo_gasto
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_circulo_insert;
DELIMITER //
CREATE TRIGGER trg_auditoria_circulo_insert
AFTER INSERT ON circulo_gasto
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_sistema (
        id_usuario, tabla_afectada, registro_id, accion,
        valores_nuevos, fecha_accion
    ) VALUES (
        NEW.id_usuario_creador, 'circulo_gasto', NEW.id_circulo_gasto, 'INSERT',
        JSON_OBJECT('nombre', NEW.nombre,
                    'moneda_base', NEW.moneda_base,
                    'id_tipo_circulo', NEW.id_tipo_circulo,
                    'creador', NEW.id_usuario_creador),
        NOW()
    );
END//
DELIMITER ;

-- ----------------------------------------------------------------------------
-- Impide cambiar la moneda base si el círculo ya tiene transacciones
-- (estado en circulo_gasto es VARCHAR: 'ACTIVO')

DROP TRIGGER IF EXISTS trg_validar_cambio_moneda_circulo;
DELIMITER //
CREATE TRIGGER trg_validar_cambio_moneda_circulo
BEFORE UPDATE ON circulo_gasto
FOR EACH ROW
BEGIN
    DECLARE v_txs INT DEFAULT 0;

    IF OLD.moneda_base != NEW.moneda_base AND OLD.estado = 'ACTIVO' THEN
        SELECT COUNT(*) INTO v_txs
        FROM transaccion
        WHERE id_circulo_gasto = NEW.id_circulo_gasto;

        IF v_txs > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No puedes cambiar la moneda de un círculo activo con transacciones';
        END IF;
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- TRIGGERS: TABLA categoria
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validar_eliminacion_categoria;
DELIMITER //
CREATE TRIGGER trg_validar_eliminacion_categoria
BEFORE DELETE ON categoria
FOR EACH ROW
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_count
    FROM transaccion
    WHERE id_categoria = OLD.id_categoria;

    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No puedes eliminar una categoría que tiene transacciones asociadas';
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- TRIGGERS: TABLA gasto
-- IMPORTANTE: incluye META, META_PROPUESTA, GASTO y DIARIO/SEMANAL/MENSUAL/TRIMESTRAL/ANUAL
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validar_gasto_programado;
DELIMITER //
CREATE TRIGGER trg_validar_gasto_programado
BEFORE INSERT ON gasto
FOR EACH ROW
BEGIN
    IF NEW.periodicidad NOT IN ('META','META_PROPUESTA','GASTO','DIARIO','SEMANAL','MENSUAL','TRIMESTRAL','ANUAL') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Periodicidad inválida. Valores permitidos: META, META_PROPUESTA, GASTO, DIARIO, SEMANAL, MENSUAL, TRIMESTRAL, ANUAL';
    END IF;

    IF NEW.valor <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El valor del gasto debe ser mayor a 0';
    END IF;
END//
DELIMITER ;

-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_auditoria_gasto_insert;
DELIMITER //
CREATE TRIGGER trg_auditoria_gasto_insert
AFTER INSERT ON gasto
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_sistema (
        id_usuario, tabla_afectada, registro_id, accion,
        valores_nuevos, fecha_accion
    ) VALUES (
        NEW.id_usuario_creador, 'gasto', NEW.id_gasto, 'INSERT',
        JSON_OBJECT('nombre', NEW.nombre,
                    'valor', NEW.valor,
                    'periodicidad', NEW.periodicidad,
                    'id_circulo', NEW.id_circulo_gasto),
        NOW()
    );
END//
DELIMITER ;

-- ============================================================================
-- TRIGGERS: TABLA usuario
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_usuario_update;
DELIMITER //
CREATE TRIGGER trg_auditoria_usuario_update
AFTER UPDATE ON usuario
FOR EACH ROW
BEGIN
    -- Auditar cambio de estado
    IF OLD.estado != NEW.estado THEN
        INSERT INTO auditoria_sistema (
            id_usuario, tabla_afectada, registro_id, accion,
            valores_anteriores, valores_nuevos, fecha_accion
        ) VALUES (
            NEW.id_usuario, 'usuario', NEW.id_usuario, 'UPDATE',
            JSON_OBJECT('estado', OLD.estado),
            JSON_OBJECT('estado', NEW.estado),
            NOW()
        );
    END IF;

    -- Auditar cambio de correo
    IF OLD.correo != NEW.correo THEN
        INSERT INTO auditoria_sistema (
            id_usuario, tabla_afectada, registro_id, accion,
            valores_anteriores, valores_nuevos, fecha_accion
        ) VALUES (
            NEW.id_usuario, 'usuario', NEW.id_usuario, 'UPDATE',
            JSON_OBJECT('correo_anterior', OLD.correo),
            JSON_OBJECT('correo_nuevo', NEW.correo),
            NOW()
        );
    END IF;
END//
DELIMITER ;

-- ----------------------------------------------------------------------------
-- Limita los cambios de contraseña a 3 por cada 30 días

DROP TRIGGER IF EXISTS trg_validar_cambios_contrasena_frecuentes;
DELIMITER //
CREATE TRIGGER trg_validar_cambios_contrasena_frecuentes
BEFORE UPDATE ON usuario
FOR EACH ROW
BEGIN
    DECLARE v_cambios INT DEFAULT 0;

    IF OLD.contrasena_hash != NEW.contrasena_hash THEN
        SELECT COUNT(*) INTO v_cambios
        FROM   auditoria_sistema
        WHERE  tabla_afectada = 'usuario'
          AND  registro_id    = OLD.id_usuario
          AND  accion         = 'CAMBIO_CONTRASENA'
          AND  fecha_accion  >= DATE_SUB(NOW(), INTERVAL 30 DAY);

        IF v_cambios >= 3 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Límite de 3 cambios de contraseña por mes alcanzado';
        END IF;

        -- Registrar el cambio
        INSERT INTO auditoria_sistema (
            id_usuario, tabla_afectada, registro_id, accion, fecha_accion
        ) VALUES (
            NEW.id_usuario, 'usuario', NEW.id_usuario, 'CAMBIO_CONTRASENA', NOW()
        );
    END IF;
END//
DELIMITER ;

SELECT 'Triggers creados exitosamente' AS resultado;
