# Quickstart: Formulario de Transacciones (Frontend)

## Probar

1. Asegurar backend corriendo: `mvn clean spring-boot:run` en `/Backend`
2. Asegurar frontend corriendo: `npm run dev` en `/Frontend`
3. Abrir el app, iniciar sesión
4. Click en "+" o "Añadir Fondos"
5. Seleccionar DEPOSITO, monto: 500000, descripción: "Salario"
6. Guardar → redirige al Dashboard con saldo actualizado

## Flujo de datos

```
TransactionForm → createTransaction(data) → POST /api/transacciones
                                                      │
Dashboard ← redirect ← navigate('/dashboard')        │
  │                                                   │
  └── getSaldo(idUsuario) → GET /api/usuarios/{id}/saldo
                              └── SUM(DEPOSITO) - SUM(RETIRO) = saldoTotal
```
