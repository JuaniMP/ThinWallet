# Research: Formulario de Transacciones Funcional

**Feature**: 003-formulario-transacciones  
**Date**: 2026-04-19

## Análisis del Gap Frontend ↔ Backend

### Endpoints del Backend (ya existentes)

| Método | Ruta | DTO | Status |
|--------|------|-----|--------|
| GET | `/api/transacciones` | — | ✅ Funcionando |
| GET | `/api/transacciones/{id}` | — | ✅ Funcionando |
| GET | `/api/transacciones/usuario/{idUsuario}` | — | ✅ Funcionando |
| POST | `/api/transacciones` | `TransaccionRequest` | ✅ Funcionando |
| PUT | `/api/transacciones/{id}` | `TransaccionRequest` | ✅ Funcionando |
| DELETE | `/api/transacciones/{id}` | — | ✅ Funcionando |

### TransaccionRequest (Backend DTO)

```java
{
  "nombre": "Salario",            // String, @NotBlank
  "montoOriginal": 500000,        // BigDecimal, @NotNull
  "monedaOriginal": "COP",        // String, opcional
  "tasaCambio": 1.0,              // BigDecimal, opcional
  "tipoMovimiento": "DEPOSITO",   // String, @NotBlank (DEPOSITO/RETIRO)
  "modalidadDivision": null,      // String, opcional
  "contexto": null,               // String, opcional
  "idUsuario": 1,                 // Long
  "idCirculoGasto": null,         // Long, opcional
  "idCategoria": null,            // Long, opcional
  "idGasto": null                 // Long, opcional
}
```

### Decisiones

1. **No se modificó el backend** — los endpoints ya estaban funcionales.
2. **Se adaptó el frontend** para usar los endpoints reales.
3. **Se eliminó la dependencia de categorías** del formulario (no requerida por el backend).
4. **Se usó `useRef`** para evitar loops en los `useEffect`.
