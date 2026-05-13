**ThinWallet — Documentación del repositorio**

Resumen
- Proyecto: ThinWallet — aplicación de gestión de gastos compartidos.
- Estructura: monorepo con carpetas `Backend/`, `Frontend/`, `Basesdedatos/`, `specs/`.
- Tecnologías principales:
  - Backend: Java (Maven, Spring Boot) — ver `Backend/pom.xml`.
  - Frontend: React + TypeScript (Vite) — ver `Frontend/package.json`.
  - Bases de datos: MySQL (SQL DDL en `Basesdedatos/Script_tablas_base_de_datos.sql`) y ejemplo de auditoría en MongoDB (`Basesdedatos/auditoria_mongodb_final.js`).

Contenido de alto nivel
- `Backend/`: código Java, entidades, controladores, servicios, recursos, tests y `pom.xml`.
- `Frontend/`: app React+TS, componentes, servicios (API), assets y configuración Vite/TypeScript.
- `Basesdedatos/`: scripts SQL y utilidades de base de datos.
- `specs/`: especificaciones funcionales y tareas por feature.

Arquitectura
- Patrón general: cliente ligero (SPA) + API REST en Spring Boot.
- Persistencia:
  - Datos transaccionales y modelo principal en MySQL (tablas en `Basesdedatos/Script_tablas_base_de_datos.sql`).
  - Auditoría/telemetría de actividad: almacenamiento de eventos en MongoDB usando Bucket Pattern y Approximation (script `auditoria_mongodb_final.js`).
- Comunicación: Frontend consume endpoints REST en `Backend/src/main/java/.../controller`.
- Seguridad: Spring Security (configuración en `Backend/src/main/java/.../config/SecurityConfig.java`).

Cómo ejecutar localmente (resumen)
1. Backend
   - Requisitos: Java 11+ (o versión especificada en `pom.xml`), Maven.
   - Comandos:
     ```bash
     cd Backend
     mvn clean package
     mvn spring-boot:run
     ```
   - Configuración: editar `Backend/src/main/resources/application.properties` para base de datos y OAuth/email.

2. Frontend
   - Requisitos: Node.js 16+/PNPM/npm/yarn
   - Comandos:
     ```bash
     cd Frontend
     npm install
     npm run dev
     ```
   - La app correrá en `http://localhost:3000` (u otro puerto configurado).

3. Bases de datos
   - MySQL: ejecutar `Basesdedatos/Script_tablas_base_de_datos.sql` en tu instancia MySQL.
   - MongoDB: para auditoría, ejecutar `mongosh gestion_gastos_audit < Basesdedatos/auditoria_mongodb_final.js`.

Guía de desarrollo y convenciones
- Backend
  - Organización por paquetes: `controller`, `service`, `repository`, `entity`, `request`, `dto`.
  - Tests: `src/test/java` con pruebas unitarias y de integración.
  - Build: Maven — `mvn test`, `mvn package`.
- Frontend
  - Componentes divididos por dominio (`components/transaction`, `components/category`, etc.).
  - Context API para autenticación y transacciones (`context/AuthContext.tsx`, `context/TransactionContext.tsx`).
  - Servicios API en `src/services/*`.

Estrategia de despliegue (recomendada)
- Backend: empaquetar JAR y desplegar en contenedor Docker/VM. Añadir CI con GitHub Actions para build y tests.
- Frontend: construir con Vite (`npm run build`) y servir estático desde CDN o servidor web.
- Bases de datos: instancias gestionadas (RDS/Cloud SQL) y MongoDB Atlas para auditoría.

Notas importantes y mejoras sugeridas
- `Backend/target/` debe estar ignorado por Git (ya actualizado). No subir artefactos compilados.
- Añadir archivos `docker-compose.yml` y `Dockerfile` para entorno local reproducible.
- Registrar claramente variables de entorno necesarias en `Frontend/.env.example` y en `Backend/.env.example`.

Archivos añadidos
- `Basesdedatos/auditoria_mongodb_final.js` — script de ejemplo para auditoría en MongoDB.
- `Basesdedatos/Script_tablas_base_de_datos.sql` — DDL principal para MySQL.

Siguientes pasos que puedo hacer por ti
- Generar `docs/ARCHITECTURE.md` con diagramas (mermaid) de componentes y flujos.
- Crear `docs/SETUP.md` con pasos detallados y comandos para entorno local y Docker.
- Añadir `CONTRIBUTING.md` y `DEVELOPMENT.md` con normas de commits, branch strategy y guía de PR.

Si quieres, genero ahora `docs/ARCHITECTURE.md` y `README.md` actualizado con enlaces a esta documentación.
