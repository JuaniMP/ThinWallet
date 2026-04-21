# Feature Specification: Saldo Total en Dashboard (Frontend)

**Feature Branch**: `002-saldo-total`  
**Created**: 2026-04-19  
**Status**: Aprobado  
**Input**: Integrar el saldo total del usuario en el Dashboard consumiendo el nuevo endpoint del backend `GET /api/usuarios/{id}/saldo`. La respuesta es mínima: solo `saldoTotal`.

## User Scenarios & Testing

### User Story 1 - Ver Saldo Total en Dashboard (Priority: P1)

Como usuario quiero ver mi saldo total real (calculado desde mis transacciones) en el dashboard para tener una referencia clara de mi situación financiera.

**Why this priority**: El saldo es la métrica principal del dashboard. Actualmente calcula el balance en frontend con `balance.totalIncome - balance.totalExpense`, pero necesita usar el endpoint real del backend que calcula el saldo desde transacciones DEPOSITO/RETIRO.

**Independent Test**: Verificar que al cargar el Dashboard, se llama al endpoint `/api/usuarios/{id}/saldo` y el valor se renderiza en el hero banner.

**Acceptance Scenarios**:

1. **Given** el usuario está logueado y tiene transacciones, **When** entra al Dashboard, **Then** ve el saldo total calculado por el backend en el hero banner.
2. **Given** el usuario no tiene transacciones, **When** entra al Dashboard, **Then** ve $0.00 en el hero banner.
3. **Given** el API tarda en responder, **When** el Dashboard carga, **Then** muestra un skeleton/loading mientras se obtiene el saldo.
4. **Given** el API falla, **When** no se puede obtener el saldo, **Then** muestra un indicador de error.

---

### Edge Cases

- ¿Qué pasa si el usuario no tiene `idUsuario` en su sesión?
- ¿Cómo se comporta el saldo si el token de autenticación expira durante la carga?
- ¿El saldo debe refrescarse automáticamente al volver al Dashboard desde otra página?

## Requirements

### Functional Requirements

- **FR-001**: El Dashboard DEBE consumir `GET /api/usuarios/{idUsuario}/saldo` al cargar.
- **FR-002**: El saldo DEBE mostrarse en el hero banner (`balance-hero`) reemplazando la lógica actual de `totalIncome - totalExpense`.
- **FR-003**: Se DEBE agregar una función `getSaldo(idUsuario)` en un servicio frontend.
- **FR-004**: Se DEBE agregar el tipo `SaldoResponse` en `types/index.ts`.
- **FR-005**: El componente DEBE mostrar un estado de loading mientras espera la respuesta.
- **FR-006**: Si la API falla, se DEBE mostrar $0.00 como fallback.

### Archivos Actuales Involucrados

| Archivo | Rol Actual |
|---------|-----------|
| [Dashboard.tsx](file:///Users/nandoski/ThinWallet/Frontend/src/pages/Dashboard/Dashboard.tsx) | Muestra `balance.totalIncome - balance.totalExpense` (línea 15) |
| [transactionService.ts](file:///Users/nandoski/ThinWallet/Frontend/src/services/transactionService.ts) | Tiene `getBalance()` que llama a `/transactions/balance` |
| [api.ts](file:///Users/nandoski/ThinWallet/Frontend/src/services/api.ts) | API wrapper base |
| [types/index.ts](file:///Users/nandoski/ThinWallet/Frontend/src/types/index.ts) | Tipos TypeScript, incluye `Balance` interface |

## Success Criteria

- **SC-001**: El hero banner del Dashboard muestra el saldo real del backend.
- **SC-002**: El saldo carga en menos de 1 segundo.
- **SC-003**: El saldo se actualiza al volver al Dashboard tras registrar una transacción.

## Assumptions

- El usuario logueado tiene su `idUsuario` disponible en el contexto de autenticación.
- El backend ya tiene implementado el endpoint `GET /api/usuarios/{id}/saldo`.
- La respuesta del backend es `{ "saldoTotal": 300000.00 }`.
