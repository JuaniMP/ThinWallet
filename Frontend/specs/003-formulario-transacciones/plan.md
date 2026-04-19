# Implementation Plan: Formulario de Transacciones (Frontend)

**Branch**: `003-formulario-transacciones` | **Date**: 2026-04-19

## Summary

Adaptar el frontend para usar los endpoints reales del backend. No requiere cambios en el backend.

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `context/TransactionContext.tsx` | Rewire completo a endpoints `/api/transacciones` |
| `components/transaction/TransactionForm.tsx` | Form envia DTO backend-compatible |
| `pages/Transactions/NewTransaction.tsx` | Nuevo signature de createTransaction |
| `pages/Transactions/TransactionList.tsx` | useRef guard + saldo real |
| `pages/Dashboard/Dashboard.tsx` | useRef guard anti-loop (hotfix spec 002) |
