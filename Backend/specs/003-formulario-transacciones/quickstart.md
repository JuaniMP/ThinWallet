# Quickstart: Formulario de Transacciones

## Prerequisitos

- Backend corriendo en `http://localhost:8080` (`mvn clean spring-boot:run`)
- Frontend corriendo (`npm run dev`)

## Probar el flujo

1. Abre `http://localhost:5175` (o tu puerto de Vite)
2. Inicia sesión con tu cuenta
3. Haz clic en **"Añadir Fondos"** o el botón **"+"** flotante
4. Selecciona **"Depósito"** o **"Retiro"**
5. Ingresa monto y descripción
6. Haz clic en **"Guardar Transacción"**
7. Verifica que el saldo se actualiza en el dashboard

## Endpoints usados

| Acción | Método | Ruta |
|--------|--------|------|
| Crear transacción | POST | `/api/transacciones` |
| Listar por usuario | GET | `/api/transacciones/usuario/{id}` |
| Eliminar | DELETE | `/api/transacciones/{id}` |
| Saldo total | GET | `/api/usuarios/{id}/saldo` |

## Ejemplo de request (POST)

```json
{
  "nombre": "Salario mensual",
  "montoOriginal": 500000,
  "tipoMovimiento": "DEPOSITO",
  "idUsuario": 1
}
```
