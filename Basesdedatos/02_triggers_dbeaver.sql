-- ============================================================================
-- THINWALLET — TRIGGERS
-- VERSIÓN PARA DBEAVER (sin DELIMITER)
-- 
-- INSTRUCCIONES:
-- En DBeaver, selecciona CADA bloque (desde DROP hasta END;)
-- y ejecútalo con Ctrl+Enter (o Cmd+Enter en Mac).
-- Ejecuta los bloques de ARRIBA hacia ABAJO, uno por uno.
-- EJECUTAR DESPUÉS de 01_funciones_y_procedimientos_dbeaver.sql
-- ============================================================================

USE thinwallet_db;

-- ============================================================================
-- TRIGGER 1: trg_validar_transaccion_insert
-- Valida que el monto sea mayor a 0 antes de insertar una transacción
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validar_transaccion_insert;

CREATE TRIGGER trg_validar_transaccion_insert
BEFORE INSERT ON transaccion
FOR EACH ROW
BEGIN
    IF NEW.monto_original <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El monto debe ser mayor a 0';
    END IF;
END;

-- ============================================================================
-- TRIGGER 2: trg_auditoria_transaccion_update
-- Audita cambios en transacción (tipo de movimiento o monto)
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_transaccion_update;

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
END;

-- ============================================================================
-- TRIGGER 3: trg_auditoria_deuda_update
-- Audita cambios de estado en deudas
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_deuda_update;

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
END;

-- ============================================================================
-- TRIGGER 4: trg_bloquear_salida_con_deuda
-- Impide salir de un círculo si hay deudas pendientes
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_bloquear_salida_con_deuda;

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
END;

-- ============================================================================
-- TRIGGER 5: trg_auditoria_usuario_circulo_insert
-- Audita cuando un usuario se une a un círculo
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_usuario_circulo_insert;

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
END;

-- ============================================================================
-- TRIGGER 6: trg_auditoria_circulo_insert
-- Audita la creación de un nuevo círculo
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_circulo_insert;

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
END;

-- ============================================================================
-- TRIGGER 7: trg_validar_cambio_moneda_circulo
-- Impide cambiar moneda en círculos activos con transacciones
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validar_cambio_moneda_circulo;

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
END;

-- ============================================================================
-- TRIGGER 8: trg_validar_eliminacion_categoria
-- Impide eliminar categorías con transacciones asociadas
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validar_eliminacion_categoria;

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
END;

-- ============================================================================
-- TRIGGER 9: trg_validar_gasto_programado
-- Valida periodicidad y valor antes de insertar un gasto
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validar_gasto_programado;

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
END;

-- ============================================================================
-- TRIGGER 10: trg_auditoria_gasto_insert
-- Audita la creación de un nuevo gasto
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_gasto_insert;

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
END;

-- ============================================================================
-- TRIGGER 11: trg_auditoria_usuario_update
-- Audita cambios de estado y correo en usuarios
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auditoria_usuario_update;

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
END;

-- ============================================================================
-- TRIGGER 12: trg_validar_cambios_contrasena_frecuentes
-- Limita cambios de contraseña a 3 por cada 30 días
-- SELECCIONA desde el DROP hasta END;  y ejecuta con Ctrl+Enter
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validar_cambios_contrasena_frecuentes;

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
END;

SELECT 'Triggers creados exitosamente' AS resultado;
