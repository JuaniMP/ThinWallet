# Tasks: Saldo Total en Dashboard (Frontend)

**Feature**: 002-saldo-total  
**Generated**: 2026-04-19  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Summary

- **Total Tasks**: 7
- **Parallelizable**: 2 tasks
- **User Stories**: 1 (P1)
- **Prerequisito**: Backend endpoint `GET /api/usuarios/{id}/saldo` implementado

## Implementation Strategy

**MVP Scope**: Saldo real del backend visible en el hero banner del Dashboard  
**Delivery**: Incremental (tipo → servicio → componente → test)

---

## Phase 1: Tipo TypeScript

- [X] T001 [P] Agregar interface `SaldoResponse` en `src/types/index.ts` con campo `saldoTotal: number`

**Archivo**: `types/index.ts`  
**Criterio de éxito**: TypeScript compila sin errores, tipo disponible para importar.

---

## Phase 2: Servicio

- [X] T002 Agregar función `getSaldo(idUsuario: number): Promise<SaldoResponse>` en `src/services/transactionService.ts` que llame a `api.get<SaldoResponse>(`/usuarios/${idUsuario}/saldo`)`

**Archivo**: `services/transactionService.ts`  
**Criterio de éxito**: La función retorna el saldo del backend correctamente.

---

## Phase 3: Componente Dashboard

- [X] T003 Modificar `Dashboard.tsx` para:
  1. Importar `transactionService.getSaldo`
  2. Obtener `idUsuario` del contexto de autenticación (useAuth)
  3. Crear estado local `const [saldoTotal, setSaldoTotal] = useState<number>(0)`
  4. Crear estado local `const [loadingSaldo, setLoadingSaldo] = useState(true)`
  5. Llamar a `getSaldo(idUsuario)` en el `useEffect` y actualizar estados
  6. Reemplazar `totalBalance` por `saldoTotal` en el hero banner
  7. Mostrar skeleton/loading mientras `loadingSaldo` es true

**Archivo**: `pages/Dashboard/Dashboard.tsx`  
**Criterio de éxito**: El hero banner muestra el saldo real del backend.

---

## Phase 4: Testing Manual

- [X] T004 Test: Dashboard muestra saldo correcto tras crear transacciones DEPOSITO/RETIRO en el backend
- [X] T005 Test: Dashboard muestra $0.00 para usuario sin transacciones
- [X] T006 Test: Dashboard muestra loading mientras el API responde
- [X] T007 Test: Dashboard muestra $0.00 si el API retorna error

---

## Dependency Graph

```
T001 (SaldoResponse type)
  │
  ▼
T002 (getSaldo en transactionService)
  │
  ▼
T003 (Dashboard.tsx modificación)
  │
  ▼
T004-T007 (Testing)
```

## Parallel Opportunities

| Task | Reason |
|------|--------|
| T001 (Frontend type), Backend T001-T004 | El tipo se puede crear mientras se implementa el backend |

## Cambio Clave en Dashboard.tsx

```diff
- const totalBalance = balance ? balance.totalIncome - balance.totalExpense : 0;
+ const [saldoTotal, setSaldoTotal] = useState<number>(0);
+ const [loadingSaldo, setLoadingSaldo] = useState(true);
+
+ useEffect(() => {
+   const user = /* obtener del auth context */;
+   if (user?.idUsuario) {
+     transactionService.getSaldo(user.idUsuario)
+       .then(res => setSaldoTotal(res.saldoTotal))
+       .catch(() => setSaldoTotal(0))
+       .finally(() => setLoadingSaldo(false));
+   }
+ }, []);
```

En el JSX del hero banner:
```diff
- <h2 className="amount">${totalBalance.toLocaleString(...)}</h2>
+ <h2 className="amount">
+   {loadingSaldo ? '...' : `$${saldoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
+ </h2>
```
