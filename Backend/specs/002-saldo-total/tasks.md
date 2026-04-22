# Tasks: Saldo Total por Historial de Transacciones (Backend)

**Feature**: 002-saldo-total  
**Generated**: 2026-04-19  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Summary

- **Total Tasks**: 9
- **Parallelizable**: 2 tasks
- **User Stories**: 1 (P1)

## Implementation Strategy

**MVP Scope**: Endpoint funcional con cálculo correcto  
**Delivery**: Incremental por capa (repository → DTO → service → controller → test)

---

## Phase 1: Repository Layer

- [X] T001 Agregar método `@Query` en `TransaccionRepository.java` para calcular saldo con `SUM(CASE WHEN tipo_movimiento = 'DEPOSITO' THEN monto_original * COALESCE(tasa_cambio, 1.0) WHEN tipo_movimiento = 'RETIRO' THEN -1 * monto_original * COALESCE(tasa_cambio, 1.0) ELSE 0 END)` filtrado por `id_usuario`

**Archivo**: `repository/TransaccionRepository.java`  
**Criterio de éxito**: El método retorna un `BigDecimal` con la suma correcta.

---

## Phase 2: DTO de Respuesta

- [X] T002 [P] Crear `SaldoResponse.java` en el paquete `request` con el campo `saldoTotal` (BigDecimal) y anotación `@Data` de Lombok

**Archivo**: `request/SaldoResponse.java` (nuevo)  
**Criterio de éxito**: Compila correctamente, Jackson serializa como `{"saldoTotal": 300000.00}`.

---

## Phase 3: Service Layer

- [X] T003 Crear `SaldoService.java` con método `calcularSaldo(Long idUsuario)` que:
  1. Valide que el usuario exista (`UsuarioRepository.findById`)
  2. Llame al nuevo método del `TransaccionRepository`
  3. Retorne `Optional<SaldoResponse>` (empty si usuario no existe)

**Archivo**: `service/SaldoService.java` (nuevo)  
**Criterio de éxito**: Retorna saldo correcto; retorna `Optional.empty()` si usuario no existe.

---

## Phase 4: Controller Layer

- [X] T004 Agregar endpoint `GET /api/usuarios/{idUsuario}/saldo` en `UsuarioController.java`
  - Inyectar `SaldoService`
  - Retornar `200 OK` con `SaldoResponse` o `404 Not Found`

**Archivo**: `controller/UsuarioController.java`  
**Criterio de éxito**: Endpoint accesible, retorna JSON correcto.

---

## Phase 5: Testing Manual

- [X] T005 Test: Insertar 3 transacciones DEPOSITO y 2 RETIRO → verificar saldo correcto
- [X] T006 Test: Usuario sin transacciones → saldo = 0.00
- [X] T007 Test: Transacción con `tasa_cambio = null` → usa 1.0
- [X] T008 Test: Usuario inexistente → retorna 404
- [X] T009 Test: Transacción con `tipo_movimiento` diferente a DEPOSITO/RETIRO → se ignora

---

## Dependency Graph

```
T001 (Repository @Query)
  │
  ├── T002 [P] (SaldoResponse DTO) ← paralelo con T001
  │
  ▼
T003 (SaldoService)
  │
  ▼
T004 (Controller endpoint)
  │
  ▼
T005-T009 (Testing)
```

## Parallel Opportunities

| Task | Reason |
|------|--------|
| T001, T002 | Repository query y DTO no tienen dependencia entre sí |

## Verification Commands

```bash
# Crear transacciones de prueba
curl -X POST http://localhost:8080/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Salario","montoOriginal":100000,"tipoMovimiento":"DEPOSITO","idUsuario":1}'

curl -X POST http://localhost:8080/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Arriendo","montoOriginal":30000,"tipoMovimiento":"RETIRO","idUsuario":1}'

# Consultar saldo
curl http://localhost:8080/api/usuarios/1/saldo
# Esperado: {"saldoTotal": 70000.00}

# Usuario inexistente
curl -v http://localhost:8080/api/usuarios/9999/saldo
# Esperado: 404 Not Found
```
