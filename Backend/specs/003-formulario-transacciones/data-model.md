# Data Model: Formulario de Transacciones

## Backend Entity (sin cambios)

### Transaccion

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id_transaccion | Long (PK) | Auto | Identificador |
| nombre | String | Si | Descripción de la transacción |
| monto_original | BigDecimal | Si | Monto de la transacción |
| moneda_original | String | No | Moneda (default implícito) |
| tasa_cambio | BigDecimal | No | Factor de conversión (null → 1.0) |
| tipo_movimiento | String | Si | `"DEPOSITO"` o `"RETIRO"` |
| modalidad_division | String | No | Para gastos compartidos |
| contexto | String | No | Contexto adicional |
| id_usuario | Long | Si | FK al usuario dueño |
| id_circulo_gasto | Long | No | FK al círculo |
| id_categoria | Long | No | FK a categoría |
| id_gasto | Long | No | FK a gasto recurrente |

## Mapeo Frontend → Backend

| Frontend (form state) | Backend (TransaccionRequest) |
|----------------------|------------------------------|
| `description` (String) | `nombre` (String) |
| `amount` (number) | `montoOriginal` (BigDecimal) |
| `type` = DEPOSITO/RETIRO | `tipoMovimiento` (String) |
| `user.idUsuario` (number) | `idUsuario` (Long) |

## Mapeo Backend → Frontend (para listar)

| Backend (Transaccion entity) | Frontend (Transaction type) |
|------------------------------|----------------------------|
| `idTransaccion` | `id` (String) |
| `nombre` | `description` |
| `montoOriginal * tasaCambio` | `amount` |
| `tipoMovimiento === 'DEPOSITO'` | `type: 'income'` |
| `tipoMovimiento === 'RETIRO'` | `type: 'expense'` |
| `idUsuario` | `userId` |
