# Research: Formulario de Transacciones (Frontend)

**Feature**: 003-formulario-transacciones  
**Date**: 2026-04-19

## Problema: Loop infinito en Dashboard

`fetchTransactions` se definía como función dentro del componente `TransactionProvider`, lo que generaba una nueva referencia en cada render. Al usarla como dependencia del `useEffect` del Dashboard, causaba re-ejecución infinita.

**Solución**: `useRef(hasFetched)` que solo permite un fetch por montaje.

## Problema: Rutas incompatibles

El frontend usaba `/transactions` y `/categories` pero el backend usa `/transacciones` y `/categorias`.

**Solución**: Actualizar los endpoints en TransactionContext directamente.

## Problema: DTO incompatible

Frontend enviaba `{ amount, description, type: 'income' }` pero el backend esperaba `{ nombre, montoOriginal, tipoMovimiento: 'DEPOSITO' }`.

**Solución**: Reescribir TransactionForm para enviar el DTO correcto.
