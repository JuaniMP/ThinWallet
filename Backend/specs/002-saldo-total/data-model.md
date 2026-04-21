# Data Model: Saldo Total por Historial de Transacciones

## Entidades Involucradas

### Transaccion (fuente de datos)

| Campo | Tipo | Requerido | Rol en el cálculo |
|-------|------|-----------|-------------------|
| id_transaccion | Long (PK) | Si | Identificador |
| monto_original | BigDecimal | Si | Valor base de la transacción |
| moneda_original | String | Si | Moneda en la que se registró |
| tasa_cambio | BigDecimal | No | Factor de conversión (default 1.0) |
| tipo_movimiento | String | Si | `"DEPOSITO"` o `"RETIRO"` |
| id_usuario | Long (FK) | Si | Dueño de la transacción |
| nombre | String | No | Descripción |
| contexto | String | No | Contexto adicional |
| id_circulo_gasto | Long (FK) | No | Círculo asociado |
| id_categoria | Long (FK) | No | Categoría |
| id_gasto | Long (FK) | No | Gasto asociado |

### Usuario (dueño del saldo)

| Campo | Tipo | Requerido | Rol |
|-------|------|-----------|-----|
| id_usuario | Long (PK) | Si | Identificador para filtrar transacciones |
| estado | Integer | Si | Solo usuarios con estado = 1 (activo) |

## DTO de Respuesta (nuevo)

### SaldoResponse

| Campo | Tipo | Descripción |
|-------|------|-------------|
| saldoTotal | BigDecimal | Suma de DEPOSITOS - Suma de RETIROS (normalizado por tasa_cambio) |

## Fórmula del Cálculo

```sql
-- Pseudo-SQL del cálculo
SELECT 
  COALESCE(SUM(
    CASE 
      WHEN tipo_movimiento = 'DEPOSITO' 
        THEN monto_original * COALESCE(tasa_cambio, 1.0)
      WHEN tipo_movimiento = 'RETIRO' 
        THEN -1 * monto_original * COALESCE(tasa_cambio, 1.0)
      ELSE 0
    END
  ), 0) AS saldo_total
FROM transaccion
WHERE id_usuario = :idUsuario
```

## Relaciones Relevantes

```
Usuario (1) ──→ (*) Transaccion
                     ├── tipo_movimiento = 'DEPOSITO' → SUMA al saldo
                     └── tipo_movimiento = 'RETIRO'   → RESTA al saldo
```

## Reglas de Validación

- `monto_original` debe ser positivo (> 0)
- `tipo_movimiento` solo acepta `"DEPOSITO"` o `"RETIRO"`
- Si `tasa_cambio` es null → se usa `1.0`
- Si el usuario no tiene transacciones → saldo = `0.00`

## Notas

- **No se crea tabla nueva** — el cálculo es con query sobre `transaccion`.
- **No se modifica esquema** — no se agregan columnas ni tablas.
- **No se incluyen deudas** — solo transacciones directas.
