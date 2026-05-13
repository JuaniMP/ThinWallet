**Setup local y con Docker — ThinWallet**

Prerequisitos
- Java 17+ y Maven
- Node.js 16+
- MySQL (o Docker)
- MongoDB (o Docker)
- Docker & Docker Compose (opcional pero recomendado)

1) Ejecutar localmente (sin Docker)

Backend
```bash
cd Backend
# configurar src/main/resources/application.properties con credenciales de BD
mvn clean package
mvn spring-boot:run
```

Frontend
```bash
cd Frontend
npm install
npm run dev
# abrir http://localhost:3000 (o el puerto que indique Vite)
```

Bases de datos
- Importar el DDL en `Basesdedatos/Script_tablas_base_de_datos.sql` en tu MySQL.
- Para la auditoría en MongoDB ejecutar:
```bash
mongosh gestion_gastos_audit < Basesdedatos/auditoria_mongodb_final.js
```

2) Con Docker (recomendado para entorno reproducible)

Archivos incluidos
- `Dockerfile.backend` — builder + runtime para la API Java
- `Dockerfile.frontend` — build estático y nginx para servir la SPA
- `docker-compose.yml` — orquesta `mysql`, `mongo`, `backend`, `frontend`

Construir y levantar el stack
```bash
# desde la raíz del repo
docker compose up --build -d
# ver logs
docker compose logs -f backend
```

Comandos importantes
- Reconstruir solo backend:
```bash
docker compose build backend && docker compose up -d backend
```
- Parar todo:
```bash
docker compose down
```

Notas de configuración
- Variables de entorno para `backend` (puedes establecerlas en `.env`):
  - `SPRING_DATASOURCE_URL` (jdbc:mysql://mysql:3306/thinwallet)
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `SPRING_PROFILES_ACTIVE` (opcional)
- Frontend: `VITE_API_BASE_URL` apuntando a `http://localhost:8080` dentro del contenedor (o el host según despliegue).

Problemas comunes
- Si MySQL no está listo al arrancar, el backend hará retry según configuración de Spring Boot; puedes usar `depends_on` y scripts de espera.

Si quieres, instalo un `.env.example` y ajusto los valores por defecto en `docker-compose.yml`.