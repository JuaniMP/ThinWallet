# ThinWallet

Aplicación web de gestión financiera personal y colectiva.  
Desarrollada con **Spring Boot 3.2.5** (backend) y **React 19 + TypeScript** (frontend).

---

## Documentación

La documentación completa del proyecto se encuentra en [`docs/DOCUMENTACION.md`](docs/DOCUMENTACION.md).

Incluye:
- Arquitectura del sistema
- Modelo de base de datos (MySQL + MongoDB)
- Catálogo de endpoints REST
- Manual de usuario
- Reglas de negocio

---

## Estructura del repositorio

```
ThinWallet/
├── Backend/          # API Java (Spring Boot, Maven)
├── Frontend/         # SPA React + TypeScript (Vite)
├── Basesdedatos/     # Scripts SQL y utilidades de base de datos
└── docs/             # Documentación técnica
```

## Inicio rápido

**Backend:**
```bash
cd Backend
mvn spring-boot:run
# API disponible en http://localhost:8080/api
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
# App disponible en http://localhost:5173
```
