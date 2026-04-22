# Implementation Plan: Formulario de Transacciones Funcional

**Branch**: `003-formulario-transacciones` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)

## Summary

Conectar el formulario del frontend de nueva transacción con el backend real. No requiere cambios en el backend — solo adaptar el frontend para que use los endpoints correctos (`/api/transacciones`) con el DTO correcto (`TransaccionRequest`).

## Technical Context

**Backend**: Sin cambios — endpoints `/api/transacciones` ya existen  
**Frontend**: React 19 + TypeScript  
**Cambios**: Solo frontend (4 archivos modificados)

## Archivos Afectados

```text
Frontend/src/
├── context/
│   └── TransactionContext.tsx    # [MODIFY] Rewire a /api/transacciones
├── components/
│   └── transaction/
│       └── TransactionForm.tsx   # [MODIFY] Enviar DTO correcto
├── pages/
│   ├── Dashboard/
│   │   └── Dashboard.tsx         # [MODIFY] useRef guard anti-loop
│   └── Transactions/
│       ├── NewTransaction.tsx    # [MODIFY] Nuevo signature  
│       └── TransactionList.tsx   # [MODIFY] useRef guard + saldo real
```

## Cambios Clave

### 1. TransactionContext.tsx
- Cambió `/transactions` → `/transacciones/usuario/{id}` para listar
- Cambió `/transactions` → `/transacciones` para crear
- Agregó mapeo `BackendTransaccion → Transaction` (frontend type)
- `createTransaction` ahora recibe `{ nombre, montoOriginal, tipoMovimiento, idUsuario }`

### 2. TransactionForm.tsx
- Selector de tipo: `DEPOSITO` / `RETIRO` (en vez de income/expense)
- Campos del form: `nombre`, `montoOriginal`, `tipoMovimiento`, `idUsuario`
- Removida dependencia de `CategorySelect` (no requerida)

### 3. Dashboard.tsx (fix spec 002)
- Agregó `useRef(hasFetched)` para ejecutar fetch solo una vez
- En error de saldo (404) → `saldoTotal = 0`, sin reintentos

### 4. TransactionList.tsx
- Mismo patrón `useRef` anti-loop
- Usa endpoint de saldo real
