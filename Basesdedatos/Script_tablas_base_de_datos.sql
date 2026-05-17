-- ==================================================================================================
-- Script DDL unificado (MySQL) exportado al folder `Basesdedatos`
-- Incluye creación de tablas principales: usuario, circulo_gasto, usuario_circulo,
-- categoria, gasto, transaccion, deuda, usuario_gasto, auditoria_sistema
-- ==================================================================================================

-- LIMPIEZA DE TABLAS (Orden inverso para evitar errores de llaves foráneas)
DROP TABLE IF EXISTS auditoria_sistema;
DROP TABLE IF EXISTS usuario_gasto;
DROP TABLE IF EXISTS deuda;
DROP TABLE IF EXISTS transaccion;
DROP TABLE IF EXISTS gasto;
DROP TABLE IF EXISTS categoria;
DROP TABLE IF EXISTS usuario_circulo;
DROP TABLE IF EXISTS circulo_gasto;
DROP TABLE IF EXISTS usuario;

-- MODELO DE DATOS UNIFICADO - SCRIPT DDL (ESTRICTO 3FN - MYSQL)

-- 1. TABLA usuario 
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    nombre_usuario VARCHAR(50), 
    correo VARCHAR(150) NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(50) NOT NULL, 
    token_reclamo VARCHAR(255),
    descripcion VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) DEFAULT 1,
    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_correo UNIQUE (correo)
);

-- 2. TABLA circulo_gasto 
CREATE TABLE circulo_gasto (
    id_circulo_gasto INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    moneda_base VARCHAR(10) DEFAULT 'USD',
    token_invitacion VARCHAR(255),
    tipo_circulo VARCHAR(50), 
    presupuesto_grupal DECIMAL(15,2) DEFAULT 0.00,
    permite_mesadas TINYINT(1) DEFAULT 0,
    permite_simplificacion_deudas TINYINT(1) DEFAULT 1,
    id_usuario_creador INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado TINYINT(1) DEFAULT 1,
    CONSTRAINT pk_circulo_gasto PRIMARY KEY (id_circulo_gasto),
    CONSTRAINT fk_circulo_creador FOREIGN KEY (id_usuario_creador) REFERENCES usuario(id_usuario),
    INDEX idx_token_invitacion (token_invitacion) 
);

-- 3. TABLA usuario_circulo 
CREATE TABLE usuario_circulo (
    id_usuario INT NOT NULL,
    id_circulo_gasto INT NOT NULL,
    rol_usuario VARCHAR(50) DEFAULT 'MIEMBRO',
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario_circulo PRIMARY KEY (id_usuario, id_circulo_gasto),
    CONSTRAINT fk_uc_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_uc_circulo FOREIGN KEY (id_circulo_gasto) REFERENCES circulo_gasto(id_circulo_gasto) ON DELETE CASCADE
);

-- 4. TABLA categoria
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

-- 5. TABLA gasto 
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

-- 6. TABLA transaccion 
CREATE TABLE transaccion (
    id_transaccion INT AUTO_INCREMENT NOT NULL,
    nombre VARCHAR(100),
    monto_original DECIMAL(15,2) NOT NULL,
    moneda_original VARCHAR(10),
    tasa_cambio DECIMAL(10,4) DEFAULT 1.0000,
    tipo_movimiento VARCHAR(50) NOT NULL, 
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
    CONSTRAINT fk_trx_gasto_prog FOREIGN KEY (id_gasto) REFERENCES gasto(id_gasto)
);

-- 7. TABLA deuda 
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

-- 8. TABLA usuario_gasto 
CREATE TABLE usuario_gasto (
    id_usuario INT NOT NULL,
    id_gasto INT NOT NULL,
    CONSTRAINT pk_usuario_gasto PRIMARY KEY (id_usuario, id_gasto),
    CONSTRAINT fk_ug_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_ug_gasto FOREIGN KEY (id_gasto) REFERENCES gasto(id_gasto)
);

-- 9. TABLA auditoria_sistema 
CREATE TABLE auditoria_sistema (
    id_auditoria INT AUTO_INCREMENT NOT NULL,
    id_usuario INT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id VARCHAR(50) NOT NULL, 
    accion VARCHAR(50) NOT NULL,
    valores_anteriores JSON,
    valores_nuevos JSON,
    direccion_ip VARCHAR(45),
    user_agent VARCHAR(255),
    ruta_endpoint VARCHAR(255),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_auditoria PRIMARY KEY (id_auditoria),
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    INDEX idx_audi_tabla_registro (tabla_afectada, registro_id),
    INDEX idx_audi_fecha (fecha_accion),
    INDEX idx_audi_usuario (id_usuario)
);
