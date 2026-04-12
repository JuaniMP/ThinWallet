# Implementation Plan: Money Tracker App

**Branch**: `001-money-tracker-app` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Aplicacion web para gestionar finanzas personales que permite registrar ingresos y gastos, categorizar transacciones, y visualizar el historial financiero. La app seguira principios de React moderno con componentes reutilizables, consumo de APIs para operaciones recurrentes, y estructura modular por funcionalidades.

## Technical Context

**Language/Version**: TypeScript / React 19.x  
**Primary Dependencies**: React Router v7, Context API (estado global), Fetch API (llamadas HTTP)  
**Storage**: API REST backend (consumo externo), localStorage para persistencia local temporal  
**Testing**: Jest + React Testing Library  
**Target Platform**: Web (navegadores modernos), responsivo (mobile + desktop)  
**Project Type**: Web Application (Frontend)  
**Performance Goals**: Carga inicial < 3s, interacciones < 200ms  
**Constraints**: Sin conexion local - requiere API, offline solo para vista de datos ya cargados  
**Scale/Scope**: 9 pantallas (del proyecto Stitch), ~50 componentes estimados

## Constitution Check

*No constitution file customized - using default rules.*

## Project Structure

### Documentation (this feature)

```text
specs/001-money-tracker-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── assets/              # Imagenes y recursos estaticicos
├── components/          # Componentes reutilizables (UI)
│   ├── common/          # Botones, inputs, cards, etc.
│   └── layout/          # Header, Footer, Layout, etc.
├── pages/               # Paginas/Pantallas de la app
│   ├── Auth/            # Login, Register, ForgotPassword
│   ├── Dashboard/       # Pantalla principal
│   ├── Transactions/    # Nueva transaccion, historial
│   └── Profile/         # Perfil de usuario
├── services/            # Llamados API (reutilizables)
│   ├── authService.ts   # Login, register, logout
│   ├── transactionService.ts
│   └── api.ts           # Config base de llamadas HTTP
├── context/            # Contextos de React (estado global)
│   ├── AuthContext.tsx
│   └── TransactionContext.tsx
├── hooks/              # Custom hooks reutilizables
├── types/              # Tipos TypeScript
├── utils/              # Funciones helper
└── App.tsx             # Entry point con rutas
```

**Structure Decision**: Estructura modular por funcionalidad, componentes separados de paginas, servicios API centralizados para evitar redundancia en llamados HTTP.

## Complexity Tracking

> No violations detected - estructura simple de frontend sin dependencias complejas.

---

# Phase 0: Research

## Research Findings

### Decision: Stack Tecnologico

- **Framework**: React 19 con TypeScript
- **Routing**: React Router v7 (latest)
- **Estado**: Context API (suficiente para escala pequena/mediana)
- **Estilos**: CSS Modules o TailwindCSS (pendiente definir con usuario)
- **Testing**: Jest + React Testing Library

### Decision: Estructura de Componentes

- Componentes de presentacion (UI) separados de componentes de contenedor
- Composicion preferida sobre herencia
- Props tipados con TypeScript

### Decision: Llamados API

- Servicio base con fetch wrapper para manejar errores comunmente
- Hooks personalizados para cada tipo de llamado (useAuth, useTransactions)
- Loading states y manejo de errores centralizado

### Decision: Gestion de Imagenes

- Carpeta `/src/assets/images/` para imagenes estaticas
- Componente Image reusable para optimizar carga

### Decision: Modularizacion

- Cada pantalla en su propia carpeta dentro `/pages/`
- Componentes especificos de pantalla junto a la pagina
- Componentes reutilizables en `/components/common/`

---

# Phase 1: Design & Contracts

## Data Model

### Entidad: Usuario
- `id`: string (UUID)
- `name`: string
- `email`: string
- `createdAt`: Date

### Entidad: Transaccion
- `id`: string (UUID)
- `userId`: string
- `amount`: number (positivo)
- `description`: string
- `type`: 'income' | 'expense'
- `category`: string
- `date`: Date
- `createdAt`: Date

### Entidad: Categoria
- `id`: string
- `name`: string
- `icon`: string (opcional)
- `type`: 'income' | 'expense' | 'both'

## Contratos API (esperados del backend)

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Recuperar contrasena

### Transactions
- `GET /api/transactions` - Listar transacciones (con filtros)
- `POST /api/transactions` - Crear transaccion
- `GET /api/transactions/:id` - Obtener transaccion
- `DELETE /api/transactions/:id` - Eliminar transaccion
- `GET /api/transactions/balance` - Obtener balance total

### Categories
- `GET /api/categories` - Listar categorias disponibles

---

# Quickstart

## Para desarrolladores

1. **Instalar dependencias**: `npm install`
2. **Ejecutar desarrollo**: `npm run dev`
3. **Ejecutar tests**: `npm test`

## Estructura de archivos clave

- `src/pages/` - Pantallas de la aplicacion
- `src/components/common/` - Componentes UI reutilizables
- `src/services/` - Llamados al API
- `src/context/` - Estado global de React
- `src/assets/` - Recursos estaticos (imagenes)

## Variables de entorno requeridas

- `VITE_API_URL` - URL base del backend API