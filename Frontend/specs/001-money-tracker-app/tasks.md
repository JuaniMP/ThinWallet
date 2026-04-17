# Tasks: Money Tracker App

**Feature**: 001-money-tracker-app  
**Generated**: 2026-04-09  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Summary

- **Total Tasks**: 42
- **Parallelizable**: 18 tasks
- **User Stories**: 6 (3 P1, 3 P2)

## Implementation Strategy

**MVP Scope**: User Story 1 + User Story 4 (basic transaction + auth)
**Delivery**: Incremental by user story priority

---

## Phase 1: Setup (Project Initialization)

- [X] T001 Inicializar proyecto React con Vite y TypeScript
- [X] T002 [P] Instalar dependencias: react-router-dom, typescript
- [X] T003 [P] Configurar estructura de carpetas segun plan.md
- [X] T004 Configurar ESLint y Prettier
- [X] T005 Crear archivo .env con VITE_API_URL

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T006 Crear tipos base en src/types/index.ts
- [X] T007 [P] Implementar API wrapper base en src/services/api.ts
- [X] T008 Crear AuthContext en src/context/AuthContext.tsx
- [X] T009 [P] Crear TransactionContext en src/context/TransactionContext.tsx
- [X] T010 Configurar React Router en src/App.tsx
- [X] T011 [P] Crear componentes layout base en src/components/layout/
- [X] T012 [P] Crear componentes comunes en src/components/common/

---

## Phase 3: User Story 4 & 5 - Autenticacion (Priority: P1)

**Goal**: Permite usuarios iniciar sesion, cerrar sesion, y crear cuenta

**Independent Test**: Login con credenciales validas -> dashboard; Credenciales invalidas -> error; Logout -> redirect a login

### Setup
- [X] T013 [P] [US4] Implementar authService en src/services/authService.ts

### Implementation
- [X] T014 [US4] Crear pagina Login en src/pages/Auth/Login.tsx
- [X] T015 [US4] Crear pagina Register en src/pages/Auth/Register.tsx
- [X] T016 [US5] Crear pagina ForgotPassword en src/pages/Auth/ForgotPassword.tsx
- [X] T017 [US4] Agregar rutas de autenticacion en App.tsx
- [X] T018 [US4] Proteger rutas privadas con AuthGuard
- [X] T019 [US4] Implementar logout en AuthContext

### Integration
- [X] T020 [US4] Integrar login con authService
- [X] T021 [US5] Integrar registro con authService

---

## Phase 4: User Story 1 & 2 - Transacciones (Priority: P1)

**Goal**: Permite registrar transacciones y ver historial

**Independent Test**: Crear transaccion -> aparece en historial; Balance muestra suma correcta

### Setup
- [X] T022 [P] [US1] Implementar transactionService en src/services/transactionService.ts

### Implementation
- [X] T023 [US1] Crear pagina Nueva Transaccion en src/pages/Transactions/NewTransaction.tsx
- [X] T024 [US1] Crear componente TransactionForm en src/components/transaction/TransactionForm.tsx
- [X] T025 [US2] Crear pagina Historial en src/pages/Transactions/TransactionList.tsx
- [X] T026 [US2] Crear componente TransactionCard en src/components/transaction/TransactionCard.tsx
- [X] T027 [US2] Crear componente BalanceSummary en src/components/transaction/BalanceSummary.tsx
- [X] T028 [US1] Agregar rutas de transacciones en App.tsx

### Integration
- [X] T029 [US1] Integrar creacion de transaccion con transactionService
- [X] T030 [US2] Integrar listado con transactionService
- [X] T031 [US2] Integrar balance con transactionService

---

## Phase 5: User Story 3 - Categorias (Priority: P2)

**Goal**: Permite categorizar transacciones y filtrar por categoria

**Independent Test**: Crear transaccion con categoria -> filtrar por categoria muestra solo esas transacciones

### Setup
- [X] T032 [P] [US3] Implementar categoryService en src/services/categoryService.ts

### Implementation
- [X] T033 [US3] Crear componente CategorySelect en src/components/category/CategorySelect.tsx
- [X] T034 [US3] Agregar filtros de categoria en TransactionList.tsx

### Integration
- [X] T035 [US3] Integrar categorias en TransactionForm
- [X] T036 [US3] Aplicar filtros en listado de transacciones

---

## Phase 6: User Story 6 - Recuperar Contrasena (Priority: P2)

**Goal**: Permite recuperar contrasena por email

**Independent Test**: Solicitud de recuperacion -> mensaje de confirmacion

### Implementation
- [X] T037 [US6] Integrar forgot-password en authService
- [X] T038 [US6] Conectar ForgotPassword con servicio

---

## Phase 7: Polish & Cross-Cutting

- [ ] T039 [P] Agregar manejo de errores global
- [ ] T040 [P] Implementar loading states
- [ ] T041 Agregar validaciones de formulario
- [ ] T042 [P] Optimizar rendimiento (lazy loading)

---

## Dependency Graph

```
Setup (T001-T005)
    │
    ▼
Foundational (T006-T012)
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
US4+US5 (T13-T21)  US1+US2 (T22-T31)  US3 (T32-T36)
    │                  │                  │
    └──────────────────┴────────┬─────────┘
                                ▼
                    US6 (T37-T38)
                                │
                                ▼
                          Polish (T39-T42)
```

## Parallel Opportunities

| Task | Reason |
|------|--------|
| T002, T003 | Instalacion y estructura pueden ser paralelas |
| T007, T011, T012 | API base, layout y common components son independientes |
| T013, T022, T032 | Servicios son independientes entre si |
| T039, T040 | Manejo de errores y loading son cross-cutting |

## Independent Test Criteria per Story

| User Story | Criteria |
|------------|----------|
| US1 | Registro de transaccion aparece en historial con monto correcto |
| US2 | Historial muestra todas las transacciones ordenadas por fecha |
| US3 | Filtro por categoria muestra solo transacciones de esa categoria |
| US4 | Login valido redirige a dashboard; invalido muestra error |
| US5 | Registro exitoso crea cuenta y redirige a login |
| US6 | Solicitud de recuperacion muestra mensaje de confirmacion |