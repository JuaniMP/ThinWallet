# Data Model: Saldo Total en Dashboard (Frontend)

## Tipos Existentes Relevantes

### User (actual)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (opcional) | ID string |
| idUsuario | number (opcional) | ID numérico del backend |
| nombres | string (opcional) | Nombres del usuario |
| correo | string (opcional) | Email |

### Balance (actual — NO se usa para esta feature)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| totalIncome | number | Suma de ingresos |
| totalExpense | number | Suma de egresos |
| balance | number | Diferencia |

## Tipo Nuevo

### SaldoResponse

| Campo | Tipo | Descripción |
|-------|------|-------------|
| saldoTotal | number | Saldo total calculado por el backend |

```typescript
export interface SaldoResponse {
  saldoTotal: number;
}
```

## Endpoint Consumido

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| GET | `/usuarios/{idUsuario}/saldo` | — | `SaldoResponse` |

## Flujo de Datos

```
Dashboard.tsx
  │
  ├── useEffect → transactionService.getSaldo(idUsuario)
  │                    │
  │                    └── api.get<SaldoResponse>(`/usuarios/${id}/saldo`)
  │                           │
  │                           └── Backend: GET /api/usuarios/{id}/saldo
  │                                  │
  │                                  └── { saldoTotal: 300000.00 }
  │
  └── Renderiza saldoTotal en el hero banner
```

## Mapeo Backend ↔ Frontend

| Backend (Java) | Frontend (TypeScript) | Notas |
|-----------------|----------------------|-------|
| `BigDecimal saldoTotal` | `number saldoTotal` | JSON serializa BigDecimal como number |
