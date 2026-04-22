# Feature Specification: Formulario de Transacciones Funcional (Frontend)

**Feature Branch**: `003-formulario-transacciones`  
**Created**: 2026-04-19  
**Status**: Implementado  

## Resumen

Conectar el formulario de nueva transacción con el backend real (`POST /api/transacciones`). Incluye fix del loop infinito del Dashboard (spec 002 hotfix).

## Cambios Realizados

### 1. `TransactionContext.tsx`
- `fetchTransactions` → llama a `/transacciones/usuario/{idUsuario}` 
- `createTransaction` → envía a `/transacciones` con DTO `{ nombre, montoOriginal, tipoMovimiento, idUsuario }`
- `deleteTransaction` → llama a `/transacciones/{id}`
- Mapeo de entidad backend a tipo frontend

### 2. `TransactionForm.tsx`
- Selector DEPOSITO / RETIRO (en vez de income/expense genérico)
- Campos: nombre (descripción), montoOriginal (monto), tipoMovimiento, idUsuario
- Removida dependencia de CategorySelect

### 3. `Dashboard.tsx` (hotfix spec 002)
- `useRef(hasFetched)` evita re-fetch infinito
- Error de saldo → `$0.00` sin reintentos

### 4. `TransactionList.tsx`
- Mismo patrón anti-loop
- Saldo desde endpoint real

## Assumptions
- El usuario logueado tiene `idUsuario` en localStorage
- Backend corriendo en el puerto configurado en `VITE_API_URL`
