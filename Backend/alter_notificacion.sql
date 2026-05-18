-- ============================================================
-- Migración: notificaciones de MongoDB → MySQL + FCM
-- Ejecutar una sola vez en la base de datos de producción
-- ============================================================

-- Tabla de notificaciones (reemplaza la colección MongoDB)
CREATE TABLE IF NOT EXISTS notificacion (
    id_notificacion  BIGINT          NOT NULL AUTO_INCREMENT,
    id_usuario_destino BIGINT        NOT NULL,
    titulo           VARCHAR(255)    NOT NULL,
    mensaje          TEXT            NOT NULL,
    tipo             VARCHAR(60)     NOT NULL,
    id_circulo_gasto BIGINT          NULL,
    nombre_circulo   VARCHAR(255)    NULL,
    leida            TINYINT(1)      NOT NULL DEFAULT 0,
    fecha_creacion   DATETIME        NOT NULL,
    PRIMARY KEY (id_notificacion),
    INDEX idx_notif_usuario   (id_usuario_destino),
    INDEX idx_notif_no_leidas (id_usuario_destino, leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Columna para el token FCM del dispositivo del usuario
ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(500) NULL;
