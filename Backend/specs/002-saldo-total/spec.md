# Feature Specification: Saldo Total por Historial de Transacciones

**Feature Branch**: `002-saldo-total`  
**Created**: 2026-04-19  
**Status**: Aprobado  
**Input**: El saldo total del usuario se calcula dinámicamente a partir de su historial de transacciones (DEPOSITO/RETIRO). Se expone un endpoint ligero que retorna solo el `saldoTotal` para el dashboard del frontend.

## User Scenarios & Testing

### User Story 1 - Consultar Saldo Total (Priority: P1)

Como usuario quiero ver mi saldo total calculado desde mis transacciones para saber cuánto dinero tengo disponible.

**Why this priority**: Es la métrica financiera más básica y central del dashboard. Sin saldo visible, el usuario no tiene referencia de su situación financiera.

**Independent Test**: Se puede probar insertando transacciones de tipo DEPOSITO y RETIRO, luego llamando al endpoint de saldo y verificando que el resultado es la diferencia correcta.

**Acceptance Scenarios**:

1. **Given** el usuario tiene 3 transacciones DEPOSITO ($100k, $50k, $200k) y 2 RETIRO ($30k, $20k), **When** consulta su saldo, **Then** el saldo total es $300,000.
2. **Given** el usuario no tiene transacciones, **When** consulta su saldo, **Then** el saldo total es $0.00.
3. **Given** el usuario tiene transacciones en diferentes monedas, **When** consulta su saldo, **Then** las transacciones se normalizan usando `monto_original * tasa_cambio` antes de sumar.

---

### User Story 2 - Mostrar Saldo en Dashboard (Priority: P1)

Como usuario quiero que mi saldo aparezca de forma prominente en el dashboard para tener una visión rápida de mis finanzas.

**Why this priority**: El dashboard es la primera pantalla que ve el usuario. El saldo debe estar visible al instante.

**Independent Test**: Se puede probar verificando que la page Dashboard hace el llamado al API y renderiza el saldo en el componente correcto.

**Acceptance Scenarios**:

1. **Given** el usuario está autenticado, **When** entra al Dashboard, **Then** ve su saldo total renderizado.
2. **Given** el API tarda en responder, **When** el saldo se está cargando, **Then** se muestra un estado de loading.
3. **Given** el API falla, **When** no se puede obtener el saldo, **Then** se muestra un mensaje de error claro.

---

### Edge Cases

- ¿Qué pasa si un usuario tiene transacciones solo de RETIRO (saldo negativo)?
- ¿Qué sucede si `tasa_cambio` es null o 0 en una transacción?
- ¿Cómo se maneja una transacción con `tipo_movimiento` diferente a DEPOSITO/RETIRO?
- ¿Qué pasa si el `id_usuario` no existe en la tabla de usuarios?

## Requirements

### Functional Requirements

- **FR-001**: El sistema DEBE calcular el saldo sumando transacciones DEPOSITO y restando transacciones RETIRO.
- **FR-002**: El cálculo DEBE normalizar monedas usando la fórmula `monto_original * tasa_cambio`.
- **FR-003**: El endpoint DEBE retornar solo `saldoTotal` (respuesta mínima).
- **FR-004**: Si `tasa_cambio` es null, se DEBE asumir `1.0` (misma moneda base).
- **FR-005**: Si el usuario no tiene transacciones, el saldo DEBE ser `0.00`.
- **FR-006**: Si el usuario no existe, el endpoint DEBE retornar 404.
- **FR-007**: El cálculo NO almacena saldo persistente — siempre se calcula dinámicamente.
- **FR-008**: El frontend DEBE consumir este endpoint y mostrar el saldo en el Dashboard.

### Key Entities

- **Transaccion**: Fuente de datos para el cálculo. Campos clave: `monto_original`, `tasa_cambio`, `tipo_movimiento`, `id_usuario`.
- **Usuario**: Dueño del saldo. Se valida existencia antes de calcular.

## Success Criteria

### Measurable Outcomes

- **SC-001**: El endpoint de saldo responde en menos de 500ms para un usuario con 1000 transacciones.
- **SC-002**: El cálculo es correcto al 100% comparado con la suma manual de transacciones.
- **SC-003**: El dashboard muestra el saldo en menos de 1 segundo tras cargar la página.
- **SC-004**: El saldo se actualiza automáticamente tras registrar una nueva transacción.

## Assumptions

- Los únicos `tipo_movimiento` válidos son `"DEPOSITO"` y `"RETIRO"`.
- La conversión de moneda se hace con `monto_original * tasa_cambio`.
- No se incluyen deudas (`Deuda`) en el cálculo del saldo — solo transacciones directas.
- El saldo es global (no filtrado por círculo de gasto).
- El frontend ya tiene una page Dashboard donde se integrará el saldo.
