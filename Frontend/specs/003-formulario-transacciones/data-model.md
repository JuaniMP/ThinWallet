# Data Model: Formulario de Transacciones (Frontend)

## Backend Entity → Frontend Type Mapping

```typescript
// Backend response (GET /api/transacciones/usuario/{id})
interface BackendTransaccion {
  idTransaccion: number;
  nombre: string;
  montoOriginal: number;
  monedaOriginal: string | null;
  tasaCambio: number | null;
  tipoMovimiento: string;  // "DEPOSITO" | "RETIRO"
  idUsuario: number;
  idCategoria: number | null;
  // ...otros campos opcionales
}

// Frontend type
interface Transaction {
  id: string;           // ← String(idTransaccion)
  userId: string;       // ← String(idUsuario)
  amount: number;       // ← montoOriginal * (tasaCambio ?? 1)
  description: string;  // ← nombre
  type: 'income' | 'expense'; // ← DEPOSITO→income, RETIRO→expense
  categoryId: string;   // ← String(idCategoria) || ''
  date: string;
  createdAt: string;
}
```

## Frontend Form → Backend DTO Mapping

```typescript
// Form data (onSubmit)
{
  nombre: "Salario",        // ← description field
  montoOriginal: 500000,    // ← amount field
  tipoMovimiento: "DEPOSITO", // ← type selector
  idUsuario: 1,             // ← from auth context
}
```
