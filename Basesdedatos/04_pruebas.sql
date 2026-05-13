USE thinwallet_db;

-- ===== VERIFICAR CREACIÓN =====
SHOW FUNCTION STATUS WHERE Db = 'thinwallet_db';
SHOW PROCEDURE STATUS WHERE Db = 'thinwallet_db';
SHOW TRIGGERS FROM thinwallet_db;

-- ===== FUNCIONES =====
SELECT fn_convertir_moneda(100, 4000)        AS convierte_100_a_tasa_4000_esperado_400000;
SELECT fn_convertir_moneda(500, NULL)         AS tasa_null_devuelve_mismo_esperado_500;
SELECT fn_calcular_deuda_usuario(1, 1)        AS deuda_usuario1_circulo1;
SELECT fn_tasa_friccion_circulo(1)            AS tasa_friccion_circulo1;
SELECT fn_contar_gastos_hormiga(1, 10000, 30) AS gastos_hormiga_usuario1;
SELECT fn_balance_usuario_periodo(1, '2026-05-01', '2026-05-31') AS balance_mayo_2026;

-- ===== PROCEDIMIENTOS =====
CALL sp_cerrar_ciclo_mensual(1, 5, 2026, @r, @m);
SELECT @r AS resultado, @m AS mensaje;

CALL sp_pagar_deuda(999999, 'EFECTIVO', @r, @m);
SELECT @r AS resultado, @m AS mensaje;

CALL sp_confirmar_pago_deuda(999999, @r, @m);
SELECT @r AS resultado, @m AS mensaje;

CALL sp_reclamar_perfil_fantasma('token_falso_xyz','Juan','Perez','juanp','juan@x.com','hash', @r, @m);
SELECT @r AS resultado, @m AS mensaje;

CALL sp_asignar_mesada(1, 2, 50000, 'MENSUAL', 999999, @r, @m);
SELECT @r AS resultado, @m AS mensaje;

-- ===== REPORTES =====
CALL sp_reporte_estado_cuenta_mensual(1, 5, 2026);
CALL sp_reporte_analisis_circulo(1);
CALL sp_reporte_deudores_pendientes(1);
CALL sp_reporte_auditoria('2026-05-01', '2026-05-31', NULL);
CALL sp_reporte_historial_pagos(1, '2026-01-01', '2026-12-31');

-- ===== AUDITORÍA =====
SELECT id_auditoria, id_usuario, tabla_afectada, accion, fecha_accion
FROM auditoria_sistema
ORDER BY fecha_accion DESC
LIMIT 20;
