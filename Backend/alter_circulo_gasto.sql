-- Agregar columna para guardar token sin hashear
ALTER TABLE circulo_gasto 
ADD COLUMN token_invitacion_original VARCHAR(255) NULL AFTER token_invitacion;
