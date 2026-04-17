# Research: Money Tracker App

**Feature**: 001-money-tracker-app
**Date**: 2026-04-09

## Stack Tecnologico

### Decision: React 19 + TypeScript

**Rationale**: React 19 es la version mas reciente con mejoras de rendimiento y nuevas features como Actions. TypeScript proporciona mejor mantenibilidad y tipos para el proyecto.

**Alternatives considered**:
- Vue 3: No preferido por usuario
- Next.js: Excesivo para app de una sola pagina
- Vanilla JS: No escalable

### Decision: React Router v7

**Rationale**: Version mas reciente de RR, compatible con React 19, soporte para rutas anidadas y loaders.

**Alternatives considered**:
- TanStack Router: Mas ligero pero curva de aprendizaje
- Wouter: Muy ligero pero menos features

### Decision: Context API para Estado

**Rationale**: Suficiente para escala pequena/mediana, no requiere dependencias extras, nativo de React.

**Alternatives considered**:
- Redux: Excesivo para esta app
- Zustand: Excelente pero agrega dependencia

## Llamados API

### Decision: Fetch con wrapper

**Rationale**: Fetch nativo no requiere dependencias, wrapper permite:
- Manejo centralizado de errores
- Headers automaticos (auth)
- Retry logic si es necesario

**Alternatives considered**:
- Axios: Popular pero innecesario para necesidades basicas
- TanStack Query: Excelente para caching pero mayor complejidad inicial

## Estructura de Proyecto

### Decision: Carpeta modular

**Rationale**: 
- Separa componentes reutilizables de especificos de pantalla
- Facilita encontrar archivos relacionados
- Escalable cuando el proyecto crezca

### Decision: Servicios API centralizados

**Rationale**:
- Evita duplicar logica de llamados HTTP
- Un solo lugar para manejar auth tokens
- Facilita testing con mocks

---

## Notas de implementacion

- Usar `vite` como build tool (estandar actual)
- Componentes funcionales con hooks (no clases)
- PropTypes o TypeScript para tipado (TypeScript preferido)
- CSS Modules para scope de estilos (evita conflictos)