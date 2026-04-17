-- Migración: reemplaza la columna tipo_circulo (VARCHAR) por id_tipo_circulo (FK)
-- Ejecutar una sola vez contra thinwallet_db

-- 1. Agregar la nueva columna FK
ALTER TABLE circulo_gasto
    ADD COLUMN id_tipo_circulo BIGINT NULL;

-- 2. Poblar id_tipo_circulo desde los valores de texto existentes
UPDATE circulo_gasto cg
    JOIN tipo_circulo tc ON UPPER(tc.nombre) = UPPER(cg.tipo_circulo)
SET cg.id_tipo_circulo = tc.id_tipo_circulo;

-- 3. Eliminar la columna de texto que ya no se usa
ALTER TABLE circulo_gasto
    DROP COLUMN tipo_circulo;

-- 4. Agregar constraint de clave foránea
ALTER TABLE circulo_gasto
    ADD CONSTRAINT fk_circulo_gasto_tipo
    FOREIGN KEY (id_tipo_circulo) REFERENCES tipo_circulo(id_tipo_circulo);
