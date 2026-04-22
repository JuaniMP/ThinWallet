-- ==============================================================================
-- 1. TABLAS CATÁLOGO (Diccionarios - Tablas Padre)
-- ==============================================================================

CREATE TABLE tipo_usuario (
    id_tipo_usuario INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_tipo_usuario PRIMARY KEY (id_tipo_usuario)
);

CREATE TABLE tipo_circulo (
    id_tipo_circulo INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_tipo_circulo PRIMARY KEY (id_tipo_circulo)
);

CREATE TABLE tipo_movimiento (
    id_tipo_movimiento INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_tipo_movimiento PRIMARY KEY (id_tipo_movimiento)
);

-- ==============================================================================
-- 2. TABLAS PRINCIPALES
-- ==============================================================================

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    nombre_usuario VARCHAR(50), 
    correo VARCHAR(150) NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    id_tipo_usuario INT NOT NULL,
    token_reclamo VARCHAR(255),
    descripcion VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) DEFAULT 1,
    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_correo UNIQUE (correo),
    CONSTRAINT fk_usuario_tipo FOREIGN KEY (id_tipo_usuario) REFERENCES tipo_usuario(id_tipo_usuario)
);

CREATE TABLE circulo_gasto (
    id_circulo_gasto INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    moneda_base VARCHAR(10) DEFAULT 'USD',
    token_invitacion VARCHAR(255),
    id_tipo_circulo INT,
    presupuesto_grupal DECIMAL(15,2) DEFAULT 0.00,
    permite_mesadas TINYINT(1) DEFAULT 0,
    permite_simplificacion_deudas TINYINT(1) DEFAULT 1,
    id_usuario_creador INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) DEFAULT 1,
    CONSTRAINT pk_circulo_gasto PRIMARY KEY (id_circulo_gasto),
    CONSTRAINT fk_circulo_creador FOREIGN KEY (id_usuario_creador) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_circulo_tipo FOREIGN KEY (id_tipo_circulo) REFERENCES tipo_circulo(id_tipo_circulo)
);

-- ==============================================================================
-- 3. TABLAS INTERMEDIAS Y DE NEGOCIO
-- ==============================================================================

CREATE TABLE usuario_circulo (
    id_usuario INT NOT NULL,
    id_circulo_gasto INT NOT NULL,
    rol_usuario VARCHAR(50) DEFAULT 'MIEMBRO',
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario_circulo PRIMARY KEY (id_usuario, id_circulo_gasto),
    CONSTRAINT fk_uc_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_uc_circulo FOREIGN KEY (id_circulo_gasto) REFERENCES circulo_gasto(id_circulo_gasto) ON DELETE CASCADE
);

CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    tipo_categoria VARCHAR(50), 
    exclusiva_perfil_solo TINYINT(1) DEFAULT 0,
    frecuencia_uso INT DEFAULT 0,
    estado TINYINT(1) DEFAULT 1,
    id_circulo_gasto INT, 
    CONSTRAINT pk_categoria PRIMARY KEY (id_categoria),
    CONSTRAINT fk_cat_circulo FOREIGN KEY (id_circulo_gasto) REFERENCES circulo_gasto(id_circulo_gasto) ON DELETE SET NULL
);

CREATE TABLE gasto (
    id_gasto INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    periodicidad VARCHAR(50) NOT NULL, 
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL DEFAULT NULL,
    estado TINYINT(1) DEFAULT 1,
    id_usuario_creador INT NOT NULL,
    id_circulo_gasto INT,
    id_categoria INT NOT NULL,
    CONSTRAINT pk_gasto PRIMARY KEY (id_gasto),
    CONSTRAINT fk_gas_usuario FOREIGN KEY (id_usuario_creador) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_gas_circulo FOREIGN KEY (id_circulo_gasto) REFERENCES circulo_gasto(id_circulo_gasto),
    CONSTRAINT fk_gas_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
);

CREATE TABLE transaccion (
    id_transaccion INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(100),
    monto_original DECIMAL(15,2) NOT NULL,
    moneda_original VARCHAR(10),
    tasa_cambio DECIMAL(10,4) DEFAULT 1.0000,
    id_tipo_movimiento INT NOT NULL, 
    modalidad_division VARCHAR(50), 
    contexto VARCHAR(255),
    fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) DEFAULT 1,
    id_usuario INT NOT NULL,       
    id_circulo_gasto INT,            
    id_categoria INT NOT NULL,      
    id_gasto INT,                  
    CONSTRAINT pk_transaccion PRIMARY KEY (id_transaccion),
    CONSTRAINT fk_trx_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_trx_circulo FOREIGN KEY (id_circulo_gasto) REFERENCES circulo_gasto(id_circulo_gasto),
    CONSTRAINT fk_trx_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
    CONSTRAINT fk_trx_gasto_prog FOREIGN KEY (id_gasto) REFERENCES gasto(id_gasto),
    CONSTRAINT fk_trx_tipo_mov FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento(id_tipo_movimiento)
);

CREATE TABLE deuda (
    id_deuda INT AUTO_INCREMENT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    metodo_pago_sugerido VARCHAR(50),
    porcentaje_division DECIMAL(5,2),
    estado_pago VARCHAR(50) DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmada TIMESTAMP NULL DEFAULT NULL,
    fecha_pago TIMESTAMP NULL DEFAULT NULL,
    id_transaccion INT NOT NULL,
    id_usuario_deudor INT NOT NULL,
    id_usuario_acreedor INT NOT NULL,
    CONSTRAINT pk_deuda PRIMARY KEY (id_deuda),
    CONSTRAINT fk_deuda_trx FOREIGN KEY (id_transaccion) REFERENCES transaccion(id_transaccion),
    CONSTRAINT fk_deuda_deudor FOREIGN KEY (id_usuario_deudor) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_deuda_acreedor FOREIGN KEY (id_usuario_acreedor) REFERENCES usuario(id_usuario)
);

CREATE TABLE usuario_gasto (
    id_usuario INT NOT NULL,
    id_gasto INT NOT NULL,
    CONSTRAINT pk_usuario_gasto PRIMARY KEY (id_usuario, id_gasto),
    CONSTRAINT fk_ug_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_ug_gasto FOREIGN KEY (id_gasto) REFERENCES gasto(id_gasto)
);

CREATE TABLE auditoria_sistema (
    id_auditoria INT AUTO_INCREMENT NOT NULL,
    id_usuario INT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id VARCHAR(50) NOT NULL, 
    accion ENUM('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
    valores_anteriores JSON,
    valores_nuevos JSON,
    direccion_ip VARCHAR(45),
    user_agent VARCHAR(255),
    ruta_endpoint VARCHAR(255),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_auditoria PRIMARY KEY (id_auditoria),
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);


-- ==============================================================================
-- FASE 1: CREACIÓN DE TABLAS CATÁLOGO Y POBLADO DE DATOS
-- ==============================================================================

-- A. TABLA tipo_usuario
CREATE TABLE tipo_usuario (
    id_tipo_usuario INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_tipo_usuario PRIMARY KEY (id_tipo_usuario)
);

INSERT INTO tipo_usuario (id_tipo_usuario, nombre) VALUES 
(1, 'Admin'), 
(2, 'Usuario');


-- B. TABLA tipo_circulo
CREATE TABLE tipo_circulo (
    id_tipo_circulo INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_tipo_circulo PRIMARY KEY (id_tipo_circulo)
);

INSERT INTO tipo_circulo (nombre) VALUES 
('Familiar'), 
('Individual');


-- C. TABLA tipo_movimiento
CREATE TABLE tipo_movimiento (
    id_tipo_movimiento INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_tipo_movimiento PRIMARY KEY (id_tipo_movimiento)
);

INSERT INTO tipo_movimiento (nombre) VALUES 
('Efectivo'), 
('Tarjeta'), 
('Transferencia');


-- ==============================================================================
-- FASE 2: ALTERAR TABLAS EXISTENTES (Agregar nuevas columnas)
-- ==============================================================================
-- Se agregan sin la restricción NOT NULL inicial por si la tabla ya tiene datos.

ALTER TABLE usuario 
ADD COLUMN id_tipo_usuario INT;

ALTER TABLE circulo_gasto 
ADD COLUMN id_tipo_circulo INT;

ALTER TABLE transaccion 
ADD COLUMN id_tipo_movimiento INT;


-- ==============================================================================
-- FASE 3: MIGRACIÓN DE DATOS (IMPORTANTE SI YA TIENES REGISTROS)
-- ==============================================================================
-- Esto enlaza los textos viejos con los IDs nuevos. 
-- Si las tablas están vacías, estos UPDATE simplemente no afectarán filas, es totalmente seguro.

-- Mapeo para usuario
UPDATE usuario SET id_tipo_usuario = 1 WHERE tipo_usuario = 'Admin' OR tipo_usuario = '1';
UPDATE usuario SET id_tipo_usuario = 2 WHERE tipo_usuario = 'Usuario' OR tipo_usuario = '2';
-- Por seguridad, si hay nulos, asignamos Usuario por defecto:
UPDATE usuario SET id_tipo_usuario = 2 WHERE id_tipo_usuario IS NULL;

-- Mapeo para circulo_gasto
UPDATE circulo_gasto SET id_tipo_circulo = 1 WHERE tipo_circulo = 'Familiar';
UPDATE circulo_gasto SET id_tipo_circulo = 2 WHERE tipo_circulo = 'Individual';
-- Por defecto si está vacío:
UPDATE circulo_gasto SET id_tipo_circulo = 2 WHERE id_tipo_circulo IS NULL;

-- Mapeo para transaccion
UPDATE transaccion SET id_tipo_movimiento = 1 WHERE tipo_movimiento = 'Efectivo';
UPDATE transaccion SET id_tipo_movimiento = 2 WHERE tipo_movimiento = 'Tarjeta';
UPDATE transaccion SET id_tipo_movimiento = 3 WHERE tipo_movimiento = 'Transferencia';
-- Por defecto si está vacío:
UPDATE transaccion SET id_tipo_movimiento = 1 WHERE id_tipo_movimiento IS NULL;


-- ==============================================================================
-- FASE 4: APLICAR RESTRICCIONES (Llaves foráneas y NOT NULL)
-- ==============================================================================

-- 1. Eliminamos la llave foránea existente que está causando el conflicto
ALTER TABLE usuario DROP FOREIGN KEY fk_usuario_tipo;

-- 2. Aseguramos que la columna no permita nulos
ALTER TABLE usuario MODIFY COLUMN id_tipo_usuario INT NOT NULL;

-- 3. Volvemos a crear la restricción limpiamente
ALTER TABLE usuario ADD CONSTRAINT fk_usuario_tipo 
FOREIGN KEY (id_tipo_usuario) REFERENCES tipo_usuario(id_tipo_usuario);


-- Para Circulo de Gasto
ALTER TABLE circulo_gasto ADD CONSTRAINT fk_circulo_tipo 
FOREIGN KEY (id_tipo_circulo) REFERENCES tipo_circulo(id_tipo_circulo);

-- Para Transaccion
ALTER TABLE transaccion MODIFY COLUMN id_tipo_movimiento INT NOT NULL;
ALTER TABLE transaccion ADD CONSTRAINT fk_trx_tipo_mov 
FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento(id_tipo_movimiento);


-- ==============================================================================
-- FASE 5: LIMPIEZA DEL ESQUEMA (Eliminar las columnas viejas VARCHAR)
-- ==============================================================================

ALTER TABLE usuario DROP COLUMN tipo_usuario;
ALTER TABLE circulo_gasto DROP COLUMN tipo_circulo;
ALTER TABLE transaccion DROP COLUMN tipo_movimiento;