# Quickstart: Saldo Total (Backend)

## Requisitos previos

- Java 21+
- Maven
- PostgreSQL corriendo con la base de datos configurada

## Ejecución

```bash
# Desde la carpeta Backend/
mvn clean spring-boot:run
```

El API estará disponible en `http://localhost:8080`

## Endpoint Nuevo

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/usuarios/{id}/saldo` | Retorna el saldo total del usuario |

## Response

```json
{
  "saldoTotal": 300000.00
}
```

## Error Responses

| Código | Cuándo |
|--------|--------|
| `200` | Saldo calculado exitosamente |
| `404` | El usuario con el ID dado no existe |

## Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `request/SaldoResponse.java` | **Nuevo** — DTO de respuesta |
| `service/SaldoService.java` | **Nuevo** — Lógica de cálculo |
| `repository/TransaccionRepository.java` | **Modificado** — Query @Query para SUM |
| `controller/UsuarioController.java` | **Modificado** — Nuevo endpoint |

## Prueba rápida

```bash
# 1. Crear una transacción DEPOSITO
curl -X POST http://localhost:8080/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Salario","montoOriginal":500000,"tipoMovimiento":"DEPOSITO","idUsuario":1}'

# 2. Crear una transacción RETIRO
curl -X POST http://localhost:8080/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mercado","montoOriginal":150000,"tipoMovimiento":"RETIRO","idUsuario":1}'

# 3. Consultar saldo
curl http://localhost:8080/api/usuarios/1/saldo
# → {"saldoTotal": 350000.00}
```

## Lógica del cálculo

```
saldoTotal = Σ(DEPOSITO * tasa_cambio) - Σ(RETIRO * tasa_cambio)
```

- Si `tasa_cambio` es null → se usa `1.0`
- Si no hay transacciones → saldo = `0.00`
- Solo se consideran tipo_movimiento `"DEPOSITO"` y `"RETIRO"`
