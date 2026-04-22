# Feature Specification: Formulario de Transacciones Funcional

**Feature Branch**: `003-formulario-transacciones`  
**Created**: 2026-04-19  
**Status**: Implementado  
**Input**: Conectar el formulario de nueva transacción del frontend con el endpoint real del backend `POST /api/transacciones` para que las transacciones se guarden en la base de datos.

## Contexto

El frontend tenía un formulario de transacciones (`NewTransaction.tsx` + `TransactionForm.tsx`) que enviaba datos a un endpoint ficticio `/transactions` con un DTO incompatible con el backend. El backend real usa:
- Endpoint: `POST /api/transacciones`
- DTO: `TransaccionRequest` con campos `nombre`, `montoOriginal`, `tipoMovimiento` (DEPOSITO/RETIRO), `idUsuario`

## Problemas Identificados

| # | Problema | Impacto |
|---|----------|---------|
| 1 | Frontend llamaba a `/transactions` pero backend usa `/transacciones` | 404 en todas las llamadas |
| 2 | Frontend enviaba `{ amount, description, type: 'income'/'expense' }` pero backend espera `{ nombre, montoOriginal, tipoMovimiento: 'DEPOSITO'/'RETIRO' }` | Error de deserialización |
| 3 | `TransactionContext.fetchTransactions()` se recreaba en cada render, causando loop infinito en `useEffect` del Dashboard | Loop infinito de requests |
| 4 | `categoryService` llamaba a `/categories` inexistente | Error al abrir formulario |

## User Scenarios & Testing

### User Story 1 - Registrar Transacción DEPOSITO (Priority: P1)

Como usuario quiero registrar un depósito desde el formulario para que se refleje en mi saldo.

**Acceptance Scenarios**:

1. **Given** el usuario está logueado, **When** va a `/transactions/new`, selecciona "Depósito", ingresa monto y descripción, y hace clic en "Guardar", **Then** la transacción se guarda en BD y se redirige al Dashboard.
2. **Given** se guardó un depósito de $100,000, **When** el usuario ve el Dashboard, **Then** el saldo total muestra $100,000.

### User Story 2 - Registrar Transacción RETIRO (Priority: P1)

Como usuario quiero registrar un retiro para que reste de mi saldo.

**Acceptance Scenarios**:

1. **Given** el usuario tiene saldo positivo, **When** registra un retiro, **Then** el saldo se reduce correctamente.

### User Story 3 - Ver Historial de Transacciones (Priority: P1)

Como usuario quiero ver todas mis transacciones registradas.

**Acceptance Scenarios**:

1. **Given** el usuario tiene transacciones, **When** va a `/transactions`, **Then** ve la lista de sus transacciones con tipo (Depósito/Retiro), monto y descripción.

## Requirements

### Functional Requirements

- **FR-001**: El formulario DEBE enviar datos al endpoint `POST /api/transacciones` con el DTO `TransaccionRequest`.
- **FR-002**: El `tipo_movimiento` DEBE ser `"DEPOSITO"` o `"RETIRO"`.
- **FR-003**: El `id_usuario` DEBE obtenerse del contexto de autenticación.
- **FR-004**: Tras guardar, DEBE redirigir al Dashboard.
- **FR-005**: El historial DEBE cargar desde `GET /api/transacciones/usuario/{idUsuario}`.
- **FR-006**: El formulario NO requiere categoría por ahora (campo opcional en backend).

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `TransactionContext.tsx` | Rewired a `/api/transacciones`, mapeo backend→frontend |
| `TransactionForm.tsx` | Envía `nombre`, `montoOriginal`, `tipoMovimiento`, `idUsuario` |
| `NewTransaction.tsx` | Actualizado para nuevo signature de `createTransaction` |
| `TransactionList.tsx` | Usa `useRef` guard, saldo endpoint real |
| `Dashboard.tsx` | `useRef` guard para evitar loop infinito de requests |
