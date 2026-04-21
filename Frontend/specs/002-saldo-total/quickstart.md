# Quickstart: Saldo Total en Dashboard (Frontend)

## Requisitos previos

- Node.js 18+
- npm
- **Backend corriendo** con el endpoint `GET /api/usuarios/{id}/saldo` implementado

## Ejecución

```bash
# Desde la carpeta Frontend/
npm run dev
```

La app estará disponible en `http://localhost:5173`

## ¿Qué cambia?

El hero banner del Dashboard ("SALDO TOTAL DISPONIBLE") ahora muestra el saldo real calculado por el backend en vez de una diferencia local de `totalIncome - totalExpense`.

### Antes
```tsx
const totalBalance = balance ? balance.totalIncome - balance.totalExpense : 0;
```
↑ Dependía de un endpoint `/transactions/balance` que no existe en el backend real.

### Después
```tsx
const [saldoTotal, setSaldoTotal] = useState(0);
// ...
transactionService.getSaldo(user.idUsuario)
  .then(res => setSaldoTotal(res.saldoTotal));
```
↑ Usa el endpoint real `GET /api/usuarios/{id}/saldo` del backend.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/types/index.ts` | Nuevo tipo `SaldoResponse` |
| `src/services/transactionService.ts` | Nueva función `getSaldo()` |
| `src/pages/Dashboard/Dashboard.tsx` | Consume saldo del backend |

## Validación rápida

1. Asegurar que el backend está corriendo en `http://localhost:8080`
2. Crear transacciones de prueba via API:
   ```bash
   curl -X POST http://localhost:8080/api/transacciones \
     -H "Content-Type: application/json" \
     -d '{"nombre":"Salario","montoOriginal":500000,"tipoMovimiento":"DEPOSITO","idUsuario":1}'
   ```
3. Abrir `http://localhost:5173` y hacer login
4. Verificar que el hero banner muestra `$500,000.00`

## Variables de entorno

```env
VITE_API_URL=http://localhost:8080/api
```
