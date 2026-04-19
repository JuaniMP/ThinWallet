# Implementation Plan: Saldo Total en Dashboard (Frontend)

**Branch**: `002-saldo-total` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)

## Summary

Integrar el saldo total real del usuario en el Dashboard consumiendo el endpoint backend `GET /api/usuarios/{id}/saldo`. Reemplazar la lógica actual de `balance.totalIncome - balance.totalExpense` con el valor directo del backend.

## Technical Context

**Language/Version**: TypeScript / React 19.x  
**Primary Dependencies**: React Router v7, Context API, Fetch API (via api.ts)  
**Backend Dependency**: Endpoint `GET /api/usuarios/{id}/saldo` debe estar implementado  
**Target Platform**: Web (Dashboard page)  
**Performance Goals**: Saldo visible en < 1 segundo  
**Constraints**: No romper la UI existente del Dashboard  
**Scale/Scope**: 1 tipo nuevo, 1 función nueva, 1 componente modificado

## Project Structure

### Documentation (this feature)

```text
Frontend/specs/002-saldo-total/
├── spec.md
├── plan.md              # Este archivo
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (archivos afectados)

```text
src/
├── types/
│   └── index.ts              # [MODIFY] Agregar SaldoResponse
├── services/
│   └── transactionService.ts # [MODIFY] Agregar getSaldo()
└── pages/
    └── Dashboard/
        └── Dashboard.tsx     # [MODIFY] Usar saldo del backend
```

## Implementation Phases

### Phase 1: Tipo TypeScript
- Agregar `SaldoResponse` interface en `types/index.ts`.

### Phase 2: Servicio
- Agregar `getSaldo(idUsuario: number)` en `transactionService.ts` que llame a `api.get<SaldoResponse>(`/usuarios/${idUsuario}/saldo`)`.

### Phase 3: Dashboard
- Modificar `Dashboard.tsx`:
  - Obtener `idUsuario` del contexto de autenticación.
  - Llamar a `getSaldo(idUsuario)` en el `useEffect`.
  - Reemplazar `totalBalance = balance.totalIncome - balance.totalExpense` con `saldoTotal` del backend.
  - Agregar estado de loading.

## Prerequisitos

> ⚠️ **El backend debe tener implementado el endpoint `GET /api/usuarios/{id}/saldo` antes de integrar en el frontend.** Ver [Backend/specs/002-saldo-total](file:///Users/nandoski/ThinWallet/Backend/specs/002-saldo-total/spec.md).
