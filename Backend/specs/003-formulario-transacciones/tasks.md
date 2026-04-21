# Tasks: Formulario de Transacciones Funcional (Backend + Frontend)

**Feature**: 003-formulario-transacciones  
**Generated**: 2026-04-19  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Summary

- **Total Tasks**: 8
- **Backend Tasks**: 0 (sin cambios, endpoints ya existentes)
- **Frontend Tasks**: 8

---

## Phase 1: Fix Dashboard Loop (Spec 002 hotfix)

- [X] T001 Agregar `useRef(hasFetched)` en `Dashboard.tsx` para evitar loop infinito
- [X] T002 En catch del saldo, setear `saldoTotal = 0` sin reintentos

---

## Phase 2: TransactionContext Rewire

- [X] T003 Cambiar `fetchTransactions` para llamar a `/transacciones/usuario/{idUsuario}`
- [X] T004 Agregar mapeo `BackendTransaccion → Transaction` (entity → frontend type)
- [X] T005 Cambiar `createTransaction` para enviar a `/transacciones` con DTO correcto

---

## Phase 3: TransactionForm Update

- [X] T006 Actualizar `TransactionForm.tsx` para enviar `nombre`, `montoOriginal`, `tipoMovimiento`, `idUsuario`
- [X] T007 Cambiar selector de tipo a DEPOSITO/RETIRO
- [X] T008 Actualizar `NewTransaction.tsx` para nuevo signature

---

## Verification

```bash
# 1. Crear un DEPOSITO
# Ir a http://localhost:5175/transactions/new
# Seleccionar "Depósito", monto: 500000, descripción: "Salario"
# Click "Guardar Transacción"
# → Redirige al Dashboard, saldo = $500,000.00

# 2. Crear un RETIRO
# Ir a http://localhost:5175/transactions/new
# Seleccionar "Retiro", monto: 150000, descripción: "Arriendo"
# Click "Guardar Transacción"
# → Redirige al Dashboard, saldo = $350,000.00

# 3. Ver historial
# Ir a http://localhost:5175/transactions
# → Lista muestra ambas transacciones
```
