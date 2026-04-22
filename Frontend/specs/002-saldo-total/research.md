# Research: Saldo Total en Dashboard (Frontend)

**Feature**: 002-saldo-total  
**Date**: 2026-04-19

## Análisis del Estado Actual

### Cómo se calcula el saldo hoy

En [Dashboard.tsx](file:///Users/nandoski/ThinWallet/Frontend/src/pages/Dashboard/Dashboard.tsx) (línea 15):

```tsx
const totalBalance = balance ? balance.totalIncome - balance.totalExpense : 0;
```

Esto depende de `fetchBalance()` del `TransactionContext`, que llama a `transactionService.getBalance()` → `GET /transactions/balance`.

**Problema**: Ese endpoint no existe en el backend actual. El backend usa `/api/transacciones` y no tiene un endpoint de balance.

### Decision: Consumir endpoint real del backend

**Rationale**: En lugar de calcular el balance en frontend sumando transacciones, usar el endpoint `GET /api/usuarios/{id}/saldo` que hace el cálculo a nivel de base de datos (más eficiente y single source of truth).

**Alternatives considered**:
- Calcular en frontend con todas las transacciones: Ineficiente, requiere traer TODAS las transacciones.
- Usar el endpoint ficticio `/transactions/balance`: No existe en el backend.

### Decision: Agregar función en un servicio nuevo o existente

**Rationale**: Agregar `getSaldo()` al `transactionService.ts` o crear un `saldoService.ts` dedicado.

**Opción elegida**: Agregar al `transactionService.ts` existente para mantener simplicidad. Es una sola función.

### Decision: Tipo de respuesta mínima

**Rationale**: El backend retorna solo `{ "saldoTotal": number }`. Crear una interface `SaldoResponse` en `types/index.ts`.

### Decision: Estado del usuario

Para llamar al endpoint necesitamos el `idUsuario`. Actualmente el contexto de autenticación guarda el usuario con posibles campos `id` o `idUsuario` (ver [types/index.ts](file:///Users/nandoski/ThinWallet/Frontend/src/types/index.ts) línea 3).

---

## Riesgos Identificados

| Riesgo | Mitigación |
|--------|------------|
| `idUsuario` no disponible en sesión | Verificar que el login guarda `idUsuario` en el contexto |
| Endpoint del backend no implementado aún | Implementar backend primero (ver Backend/specs/002-saldo-total) |
| Tipo `Balance` existente podría conflictuar | No tocar `Balance` — agregar `SaldoResponse` como tipo separado |
