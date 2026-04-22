# Research: Saldo Total por Historial de Transacciones

**Feature**: 002-saldo-total  
**Date**: 2026-04-19

## Análisis del Modelo Actual

### Decision: Cálculo Dinámico vs. Campo Persistente

**Rationale**: Calcular el saldo en tiempo real sumando/restando transacciones elimina problemas de desincronización que ocurren con un campo `saldo` almacenado en la tabla `usuario`. Si se guarda el saldo como campo, cualquier bug en la actualización deja datos inconsistentes.

**Alternatives considered**:
- Campo `saldo` en `usuario`: Más rápido de consultar pero propenso a inconsistencias.
- Vista materializada en BD: Buen rendimiento pero agrega complejidad de mantenimiento.
- Cache con invalidación: Sobre-ingeniería para el volumen actual.

### Decision: Query Nativa en la Base de Datos

**Rationale**: Hacer `SUM()` a nivel de base de datos es significativamente más eficiente que traer todas las transacciones a memoria Java y sumarlas. Spring Data JPA permite usar `@Query` con JPQL o SQL nativo.

**Alternatives considered**:
- Traer lista y sumar en Java con streams: Ineficiente para muchas transacciones.
- Stored Procedure: Más performante pero acopla lógica al motor de BD.

### Decision: tipo_movimiento = "DEPOSITO" / "RETIRO"

**Rationale**: Confirmado por el usuario. `"DEPOSITO"` suma al saldo, `"RETIRO"` resta del saldo. No existen otros tipos de movimiento por ahora.

### Decision: Conversión de Moneda con tasa_cambio

**Rationale**: La entidad `Transaccion` ya tiene los campos `moneda_original` y `tasa_cambio`. La fórmula normalizada es:

```
monto_convertido = monto_original * tasa_cambio
```

Si `tasa_cambio` es `null`, se asume `1.0` (transacción en moneda base).

### Decision: No incluir Deudas en el saldo

**Rationale**: Confirmado por el usuario (Opción A). El saldo solo refleja la suma directa de transacciones. Las deudas (`Deuda`) son un concepto separado que no afecta el saldo total del usuario.

### Decision: Solo Saldo Global

**Rationale**: Confirmado por el usuario. No se necesita filtro por `CirculoGasto`. Un solo saldo total con todas las transacciones del usuario.

### Decision: Respuesta Mínima

**Rationale**: El frontend solo necesita el `saldoTotal` como número. No se requiere desglose, breakdown por categoría, ni información adicional. Esto minimiza el payload y la complejidad.

---

## Archivos Afectados

| Archivo | Acción | Justificación |
|---------|--------|---------------|
| `TransaccionRepository.java` | Modificar | Agregar query `@Query` para `SUM(monto_original * tasa_cambio)` agrupados por `tipo_movimiento` |
| `SaldoResponse.java` | Crear | DTO de respuesta con solo `saldoTotal` |
| `SaldoService.java` | Crear | Lógica de cálculo: obtener sumas de DEPOSITO y RETIRO, restar |
| `UsuarioController.java` | Modificar | Agregar endpoint `GET /api/usuarios/{id}/saldo` |

## Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Performance con muchas transacciones | Baja | Medio | Query nativa con `SUM()` — eficiente hasta millones de registros |
| `tasa_cambio` null causa NPE | Media | Alto | Usar `COALESCE(tasa_cambio, 1.0)` en la query |
| `tipo_movimiento` con valor inesperado | Baja | Bajo | Ignorar transacciones que no sean DEPOSITO/RETIRO |
