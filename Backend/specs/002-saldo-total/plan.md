# Implementation Plan: Saldo Total por Historial de Transacciones

**Branch**: `002-saldo-total` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)

## Summary

Implementar un endpoint `GET /api/usuarios/{id}/saldo` que calcule dinámicamente el saldo total del usuario sumando sus transacciones DEPOSITO y restando las de RETIRO. El cálculo se realiza con una query nativa en la base de datos para máxima eficiencia. La respuesta es mínima: solo `saldoTotal`.

## Technical Context

**Language/Version**: Java 21 / Spring Boot 3.x  
**Primary Dependencies**: Spring Data JPA, Lombok, PostgreSQL  
**Storage**: PostgreSQL (tabla `transaccion` existente)  
**Target Platform**: REST API  
**Performance Goals**: Respuesta < 500ms con 1000+ transacciones  
**Constraints**: Sin cambios al esquema de base de datos  
**Scale/Scope**: 1 endpoint nuevo, 2 archivos nuevos, 2 archivos modificados

## Project Structure

### Documentation (this feature)

```text
Backend/specs/002-saldo-total/
├── spec.md              # Especificación funcional
├── plan.md              # Este archivo
├── research.md          # Decisiones técnicas
├── data-model.md        # Modelo de datos y fórmula
├── quickstart.md        # Guía rápida de desarrollo
└── tasks.md             # Tareas de implementación
```

### Source Code (archivos afectados)

```text
src/main/java/co/edu/unbosque/
├── controller/
│   └── UsuarioController.java     # [MODIFY] Agregar endpoint de saldo
├── service/
│   └── SaldoService.java          # [NEW] Lógica de cálculo
├── repository/
│   └── TransaccionRepository.java # [MODIFY] Agregar query @Query
└── request/
    └── SaldoResponse.java         # [NEW] DTO de respuesta
```

## Clarificaciones Resueltas

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | Valores de `tipo_movimiento` | `"DEPOSITO"` (ingreso) y `"RETIRO"` (egreso) |
| 2 | ¿Incluir deudas? | No, solo transacciones directas (Opción A) |
| 3 | ¿Saldo por círculo? | No, solo saldo global |
| 4 | ¿Conversión de moneda? | `monto_original * tasa_cambio`, null → 1.0 |
| 5 | ¿Nivel de detalle? | Mínimo — solo `saldoTotal` para el dashboard |

## Implementation Phases

### Phase 1: Repository Layer
- Agregar método con `@Query` en `TransaccionRepository` que haga `SUM(CASE WHEN...)` directamente en la BD.

### Phase 2: DTO
- Crear `SaldoResponse.java` con un solo campo `saldoTotal` de tipo `BigDecimal`.

### Phase 3: Service Layer
- Crear `SaldoService.java` que llame al repository y construya el `SaldoResponse`.
- Validar que el usuario exista antes de calcular.

### Phase 4: Controller Layer
- Agregar `GET /api/usuarios/{id}/saldo` en `UsuarioController.java`.
- Inyectar `SaldoService`, retornar 200 con saldo o 404 si no existe el usuario.

### Phase 5: Testing
- Probar con Postman/curl insertando DEPOSITOS y RETIROS.
- Validar edge cases (sin transacciones, tasa_cambio null, usuario inexistente).

## Complexity Tracking

> Complejidad baja — 2 archivos nuevos, 2 modificaciones menores, 1 query SQL.
