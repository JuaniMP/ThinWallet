# Progreso ThinWallet — 2026-05-12

## Resumen general

Sesión de desarrollo continuo. Se completaron funcionalidades de negocio, scripts de base de datos MySQL, integración de auditoría y preparación del repositorio para CI/CD.

---

## 1. Auditoría SQL (`auditoria_sistema`)

**Problema:** La tabla `auditoria_sistema` siempre aparecía vacía aunque el servicio Java existía.

**Causa:** `AuditoriaSistemaService` nunca era llamado desde los servicios de negocio.

**Solución:**
- Se agregó método helper `registrar()` en `AuditoriaSistemaService` con try/catch interno para que un fallo de auditoría no rompa la transacción principal.
- Se inyectó `AuditoriaSistemaService` (con `@Autowired(required=false)`) en los 5 servicios principales:

| Servicio | Eventos registrados |
|---|---|
| `TransaccionService` | INSERT, UPDATE, DELETE en `transaccion` |
| `DeudaService` | INSERT, CONFIRMAR_PAGO, RECHAZAR_PAGO, DELETE en `deuda` |
| `GastoService` | INSERT, UPDATE, DELETE en `gasto` |
| `UsuarioService` | REGISTRO, VERIFICACION_CORREO, CAMBIO_CONTRASENA, RECLAMACION_PERFIL en `usuario` |
| `CirculoGastoService` | INSERT, INVITAR_USUARIO, EXPULSAR_MIEMBRO, DELETE en `circulo_gasto` |

---

## 2. Scripts de Base de Datos MySQL

Se crearon 4 archivos SQL en `Backend/Basesdedatos/`:

### `01_funciones_y_procedimientos.sql`
- `fn_convertir_moneda(monto, tasa)` — conversión de moneda con tasa null-safe
- `fn_calcular_deuda_usuario(id_usuario, id_circulo)` — suma deudas PENDIENTE + CONFIRMADA_PENDIENTE
- `fn_tasa_friccion_circulo(id_circulo)` — ratio deudas pendientes / total
- `fn_contar_gastos_hormiga(id_usuario, umbral, dias)` — gastos pequeños acumulados
- `fn_balance_usuario_periodo(id_usuario, fecha_inicio, fecha_fin)` — ingresos - egresos
- `sp_cerrar_ciclo_mensual` — cierre de mes con validaciones
- `sp_pagar_deuda` — marcar deuda como pagada
- `sp_confirmar_pago_deuda` — confirmar pago y actualizar estado
- `sp_asignar_mesada` — asignar mesada periódica a miembro
- `sp_reclamar_perfil_fantasma` — convertir usuario fantasma en cuenta real
- `sp_crear_transaccion` + `sp_calcular_deudas` — flujo completo de transacción con deudas

### `02_triggers.sql`
11 triggers corregidos para el esquema real de la BD:
- Validación de monto > 0 en INSERT de transaccion
- Auditoría automática en UPDATE de transaccion, deuda, usuario, gasto, usuario_circulo, circulo_gasto
- Bloqueo de salida de círculo con deuda pendiente
- Bloqueo de cambio de moneda en círculo activo con transacciones
- Protección contra eliminación de categorías en uso
- Límite de 3 cambios de contraseña por mes
- Validación de periodicidad en gasto programado

### `03_reportes.sql`
5 stored procedures de reporte:
- `sp_reporte_estado_cuenta_mensual` — ingresos/egresos/categorías por mes
- `sp_reporte_analisis_circulo` — miembros, deudas, indicadores de salud
- `sp_reporte_deudores_pendientes` — deudores activos de un círculo
- `sp_reporte_auditoria` — trazabilidad por rango de fechas
- `sp_reporte_historial_pagos` — historial de pagos de un usuario

### `04_pruebas.sql`
Script compacto para verificar todos los objetos creados (SHOW FUNCTION/PROCEDURE/TRIGGERS + casos de prueba).

**Nota:** Los triggers se ejecutan en DBeaver con `Cmd+Shift+Enter` (ejecutar como script). El comando `DELIMITER //` no funciona con `Cmd+Enter` normal.

---

## 3. Nuevas páginas Frontend

### `/goals` — Metas de ahorro (`Goals.tsx`)
- CRUD completo de metas (periodicidad=META)
- Selector de categoría obligatorio (resuelve error 500 de columna NOT NULL)
- Barra de progreso basada en rango de fechas
- Grid de tarjetas con estado activo/vencido

### `/scheduled` — Gastos programados (`ScheduledExpenses.tsx`)
- CRUD de gastos DIARIO/SEMANAL/MENSUAL
- Badge de vencimiento
- Selector de periodicidad y categoría

---

## 4. Otras funcionalidades backend

### `CronJobService.java`
- Job diario `@Scheduled(cron = "0 0 0 * * *")`
- Procesa gastos programados activos y los convierte en transacciones automáticas
- `@EnableScheduling` agregado en `ThinWalletApplication`

### `ReporteController.java` + `ReporteService.java`
- `GET /api/reportes/pdf/{idUsuario}` — descarga PDF con iText 7
- `GET /api/reportes/csv/{idUsuario}` — descarga CSV

### `GlobalExceptionHandler.java`
- `@RestControllerAdvice` que captura todas las excepciones y devuelve JSON con clase y mensaje
- Útil para diagnosticar errores 500

### Reclamación de perfil fantasma
- `POST /api/usuarios/reclamar-perfil`
- Convierte usuario fantasma (idTipoUsuario=3) en cuenta real (idTipoUsuario=2)

---

## 5. Fixes de CI/CD (lint + prettier + build)

Antes del push se corrigieron todos los errores que habrían fallado el CI:

| Error | Archivo | Fix |
|---|---|---|
| `react-hooks/set-state-in-effect` | `AuthContext.tsx` | Inicialización lazy desde localStorage (sin useEffect) |
| `react-refresh/only-export-components` | `AuthContext.tsx`, `TransactionContext.tsx` | `// eslint-disable-next-line` |
| `@typescript-eslint/no-unused-vars` | `TransactionContext.tsx` | `// eslint-disable-next-line` en `_filters` |
| `react-hooks/set-state-in-effect` | `Profile.tsx` | Inicializar `loadingProfile` / `loadingSaldo` basado en `!!authUser?.idUsuario` |
| `TS1294 erasableSyntaxOnly` | `api.ts` | Convertir `public readonly` en constructor a campo de clase explícito |
| Prettier (36 archivos) | Todo el frontend | `npx prettier --write "src/**/*.{ts,tsx}"` |

---

## 6. Push a GitHub

- Rama: `dev-frontend` → `https://github.com/JuaniMP/ThinWallet`
- Se resolvieron conflictos de merge (rama local y remota habían divergido 5 commits cada una)
- Se tomó nuestra versión para archivos backend (versión más completa con audit wiring)
- Se tomó la versión remota para `CircleDetail.tsx` y base de `circuloGastoService.ts`
- Se agregaron métodos faltantes `getCirclesByUser` y `joinCircle` al servicio
- Se eliminó `loginWithToken` duplicado en `authService.ts`
- CI checks: lint ✓ · prettier ✓ · build ✓

---

## Pendientes / Notas

- `Backend/target/` está siendo tracked por git (incluye el `.jar` de 71 MB). Agregar al `.gitignore` para evitar warnings de GitHub en futuros pushes.
- Los triggers MySQL funcionan pero requieren ejecutar el script con "ejecutar como script completo" en DBeaver, no línea por línea.
- La tabla `auditoria_sistema` ya se populará automáticamente con cualquier operación nueva (transacciones, deudas, gastos, usuarios, círculos).

---

# Progreso ThinWallet — 2026-05-13 (6 fases)

## Resumen general

Implementación de funcionalidades faltantes del wishlist (RF-07, RF-10, RF-11, RF-13, RF-15, RNF-01, RNF-05, RNF-11, RNF-13) en 6 fases. **No se modificaron entidades JPA**. Se omitieron por instrucción: APIs Booking (RF-12), CAPTCHA fuerte (RF-05), Redis.

---

## Fase 1 — Endpoints sobre SPs/funciones existentes

### Backend Java (nuevo)
- `service/GastosHormigaService.java` — llama `fn_contar_gastos_hormiga` + listado paralelo via JdbcTemplate
- `service/CicloService.java` — invoca `sp_cerrar_ciclo_mensual` con OUT params
- `controller/CicloController.java` — `POST /api/ciclos/cerrar-mensual`
- `dto/GastosHormigaResponse.java`
- `dto/CierreCicloResponse.java`
- `request/CierreCicloRequest.java`

### Backend Java (modificado)
- `controller/TransaccionController.java` — añadido `GET /api/transacciones/gastos-hormiga/{idUsuario}`

### Base de Datos
- `Basesdedatos/01_funciones_y_procedimientos.sql` — añadida `fn_recomendar_ahorro(id_usuario, ingreso_mensual)` que devuelve JSON con 50/30/20 + cumplimiento
- `Basesdedatos/01_funciones_y_procedimientos_dbeaver.sql` — variante DBeaver de la misma función

---

## Fase 2 — Coach Financiero (RF-11)

### Backend Java (nuevo)
- `service/CoachFinancieroService.java` — regla 50/30/20 con clasificación NECESIDAD/DESEO por keywords sobre `categoria.nombre`
- `controller/CoachController.java` — `GET /api/coach/recomendacion/{idUsuario}?ingresoMensual=N` y `GET /api/coach/reglas`
- `dto/CoachRecomendacionResponse.java` — objetivos, gastos reales, %, recomendaciones y desglose por categoría para charts

---

## Fase 3 — Frontend (4 páginas + gráficos)

### Dependencias
- Instalado `recharts@^3.8.1` para gráficos interactivos

### Servicios nuevos
- `services/gastosHormigaService.ts`
- `services/coachService.ts`
- `services/cicloService.ts`
- `services/reclamarPerfilService.ts`

### Páginas nuevas
- `pages/GastosHormiga/GastosHormiga.tsx` → ruta `/gastos-hormiga` con umbral/días + listado de micro-gastos
- `pages/Ciclos/CierreMensual.tsx` → ruta `/cierre-mensual` con selector de círculo/mes/año
- `pages/Auth/ReclamarPerfil.tsx` → ruta pública `/reclamar-perfil?token=…` para usuarios fantasma

### Páginas modificadas
- `pages/Dashboard/Dashboard.tsx` — añadidos PieChart (gasto por categoría) y BarChart (50/30/20 objetivo vs real) con recharts
- `pages/Goals/Goals.tsx` — tarjeta del Coach Financiero al inicio con barras de cumplimiento por bloque (Necesidades/Deseos/Ahorro) y recomendaciones accionables

### Routing
- `App.tsx` — 3 rutas nuevas (`/reclamar-perfil` pública, `/gastos-hormiga` y `/cierre-mensual` privadas)

### Fix pre-existente
- `services/authService.ts` — eliminado duplicado de `loginWithToken` que rompía `tsc -b`

---

## Fase 4 — Sincronización real-time SSE (RF-07)

### Backend Java (nuevo)
- `service/SseEventBus.java` — bus en memoria con `ConcurrentHashMap<Long, List<SseEmitter>>`, timeout 1h, cleanup automático en completion/timeout/error, push inicial del saldo
- `controller/EventosController.java` — `GET /api/eventos/saldos/{idUsuario}` con `MediaType.TEXT_EVENT_STREAM_VALUE`

### Backend Java (modificado)
- `service/TransaccionService.java` — inyecta `SseEventBus` (`@Autowired(required=false)`) y publica saldo en create/update/delete
- `service/DeudaService.java` — mismo patrón en create/confirmarPago/rechazarPago/delete; publica para deudor y acreedor

### Frontend
- `hooks/useSaldoStream.ts` — `EventSource` con reconexión automática, listener `saldo`
- `pages/Dashboard/Dashboard.tsx` — usa `useSaldoStream(user.id, setSaldo)`
- `context/TransactionContext.tsx` — expone `setSaldo` para que el hook actualice sin re-fetch

---

## Fase 5 — Seguridad y rendimiento

### Backend Java (nuevo)
- `service/AesCipherService.java` — AES-256-GCM con IV aleatorio, clave maestra desde property (override por env `THINWALLET_CIPHER_MASTER_KEY`). `encrypt()` / `decrypt()` con fallback transparente para datos legacy. **No toca entidades**: se inyecta donde se quiera cifrar antes de persistir.
- `config/RateLimitFilter.java` — `OncePerRequestFilter` con ventana deslizante en memoria por IP. Default 120 req/min. Excluye SSE y actuator. Devuelve 429 + `Retry-After`. Activable con `thinwallet.rate-limit.enabled=true`.

### Config
- `resources/application.properties` — añadidas `thinwallet.cipher.master-key` y `thinwallet.rate-limit.*`

### Base de Datos
- `Basesdedatos/06_indices.sql` — 14 índices idempotentes (`DROP IF EXISTS` + `CREATE`) sobre `transaccion`, `deuda`, `auditoria_sistema`, `usuario`, `usuario_circulo`, `gasto`. Incluye verificación final con `INFORMATION_SCHEMA.STATISTICS`.

---

## Fase 6 — Infraestructura (RNF-11)

### Scripts
- `scripts/backup.sh` — `mysqldump` (`--single-transaction --routines --triggers --events`) + `mongodump` con gzip, retención configurable (default 14 días), instrucciones de cron en cabecera
- `scripts/backup.env.example` — plantilla de credenciales por env vars

### Config repo
- `.gitignore` — excluye `backups/` y `scripts/backup.env`

### Omitido a propósito
- **Redis**: no aporta valor sin métricas de latencia que lo justifiquen. Mantener para una segunda iteración si aparecen cuellos de botella.

---

## Endpoints nuevos disponibles

| Método | Path | Función |
|---|---|---|
| `GET`  | `/api/transacciones/gastos-hormiga/{idUsuario}?umbral=N&dias=N` | Detección de micro-gastos |
| `POST` | `/api/ciclos/cerrar-mensual` | Cierre de ciclo con SP |
| `GET`  | `/api/coach/recomendacion/{idUsuario}?ingresoMensual=N` | Recomendación 50/30/20 |
| `GET`  | `/api/coach/reglas` | Texto de referencia de la regla |
| `GET`  | `/api/eventos/saldos/{idUsuario}` | Stream SSE de saldos |

---

## Rutas frontend nuevas

- `/gastos-hormiga` (privada)
- `/cierre-mensual` (privada)
- `/reclamar-perfil?token=…` (pública)

---

## Acciones manuales pendientes para el usuario

1. **Ejecutar `Basesdedatos/01_funciones_y_procedimientos_dbeaver.sql`** (o solo la nueva `fn_recomendar_ahorro`) en DBeaver para que el Coach use el cálculo SQL.
2. **Ejecutar `Basesdedatos/06_indices.sql`** en DBeaver para crear los 14 índices.
3. **En el VPS**: instalar `mysql-client` y `mongodb-database-tools`, copiar `scripts/backup.env.example` → `scripts/backup.env`, rellenar credenciales y registrar el cron:
   ```
   0 3 * * *  /ruta/repo/scripts/backup.sh >> /var/log/thinwallet-backup.log 2>&1
   ```
4. **En producción**: sobrescribir la clave AES con la variable de entorno `THINWALLET_CIPHER_MASTER_KEY` (la default solo sirve para dev).

---

## Builds verificados

- Backend: `mvn clean compile` → 113 archivos fuente, BUILD SUCCESS
- Frontend: `npm run build` → 621 módulos transformados, sin errores TypeScript
