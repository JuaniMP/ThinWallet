# ThinWallet — Documentación Técnica

**Universidad El Bosque · Ingeniería de Sistemas**  
**Proyecto de Desarrollo de Software**  
**Año:** 2024–2025

---

## Índice

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Configuración del Entorno](#4-configuración-del-entorno)
5. [Modelo de Base de Datos](#5-modelo-de-base-de-datos)
   - 5.1 [Base de datos relacional — MySQL](#51-base-de-datos-relacional--mysql)
   - 5.2 [Diagrama Entidad–Relación](#52-diagrama-entidadrelación)
   - 5.3 [Descripción de tablas](#53-descripción-de-tablas)
   - 5.4 [Base de datos documental — MongoDB](#54-base-de-datos-documental--mongodb)
   - 5.5 [Descripción de colecciones](#55-descripción-de-colecciones)
6. [Catálogo de Endpoints — API REST](#6-catálogo-de-endpoints--api-rest)
7. [Manual de Usuario](#7-manual-de-usuario)
8. [Reglas de Negocio](#8-reglas-de-negocio)

---

## 1. Descripción del Proyecto

**ThinWallet** es una aplicación web de gestión financiera personal y colectiva. Permite a los usuarios registrar ingresos y gastos, formar círculos de gasto compartidos, establecer metas de ahorro grupales, gestionar deudas entre personas y visualizar reportes financieros.

### Funcionalidades principales

| Módulo | Descripción |
|--------|-------------|
| Autenticación | Registro, verificación por correo, recuperación de contraseña, inicio por token de invitación |
| Transacciones | Registro de ingresos y egresos con soporte multi-moneda y categorización |
| Círculos de Gasto | Grupos colaborativos con historial compartido, metas grupales y gestión de miembros |
| Gastos Programados | Suscripciones y pagos recurrentes con recordatorio automático diario |
| Metas Grupales | Propuesta, votación y seguimiento de objetivos de ahorro colectivo |
| Deudas | Registro, confirmación y rechazo de deudas entre usuarios |
| Reportes | Generación de reportes en PDF y CSV por usuario |
| Notificaciones | Sistema de notificaciones en tiempo real almacenado en MongoDB |
| Usuario fantasma | Usuarios invitados con acceso parcial que pueden reclamar su perfil |

---

## 2. Arquitectura del Sistema

El sistema sigue una arquitectura **cliente–servidor de tres capas**:

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                    │
│         React 19 + TypeScript + Vite + React Router      │
│              Puerto: 5173                                │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP/REST (JSON)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  SERVIDOR (Backend API)                   │
│       Spring Boot 3.2.5 · Java 17 · Maven               │
│              Puerto: 8080                                │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Controllers │→ │  Services   │→ │  Repositories   │  │
│  └─────────────┘  └─────────────┘  └────────┬────────┘  │
└───────────────────────────────────────────┬─┴────────────┘
                                            │
                    ┌───────────────────────┼──────────────┐
                    ▼                                      ▼
     ┌──────────────────────────┐   ┌─────────────────────────────┐
     │       MySQL 8.x          │   │          MongoDB             │
     │  Base de datos principal │   │  Notificaciones, auditoría, │
     │  (datos transaccionales) │   │  indicadores, actividad     │
     └──────────────────────────┘   └─────────────────────────────┘
```

### Patrón de diseño

El backend implementa el patrón **Repository** con Spring Data JPA para MySQL y Spring Data MongoDB para la capa documental. La seguridad se gestiona con **Spring Security** sin JWT (sesión por token generado en cliente). El frontend usa **Context API** de React para estado global de autenticación y moneda.

---

## 3. Stack Tecnológico

### Backend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Java | 17 | Lenguaje de programación |
| Spring Boot | 3.2.5 | Framework web |
| Spring Data JPA | 3.2.5 | ORM para MySQL |
| Spring Data MongoDB | 3.2.5 | ODM para MongoDB |
| Spring Security | 3.2.5 | Autenticación y CORS |
| Spring Mail | 3.2.5 | Envío de correos (SMTP Gmail) |
| MySQL Connector/J | — | Driver JDBC para MySQL |
| Lombok | 1.18.44 | Reducción de código boilerplate |
| iText 7 | 7.2.5 | Generación de reportes PDF |
| Maven | 3.x | Gestión de dependencias |

### Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.2.4 | Biblioteca UI |
| TypeScript | 6.0.2 | Tipado estático |
| Vite | 8.0.4 | Bundler y servidor de desarrollo |
| React Router DOM | 7.14.0 | Enrutamiento SPA |
| ESLint | 9.39.4 | Linting y calidad de código |

### Bases de datos

| Motor | Rol | Colección / Esquema |
|-------|-----|---------------------|
| MySQL 8.x | Datos transaccionales (principal) | `thinwallet_db` |
| MongoDB | Datos documentales (auditoría, notificaciones) | `gestion_gastos_audit` |

---

## 4. Configuración del Entorno

### Requisitos previos

- Java 17 o superior
- Maven 3.8+
- Node.js 20+
- MySQL 8.x en ejecución
- MongoDB 6.x (opcional — el sistema opera sin él, pero las notificaciones quedan desactivadas)

### Backend

**1. Clonar el repositorio:**
```bash
git clone <url-repositorio>
cd ThinWallet/Backend
```

**2. Configurar `application.properties`:**
```properties
# MySQL
spring.datasource.url=jdbc:mysql://<host>:3306/thinwallet_db
spring.datasource.username=<usuario>
spring.datasource.password=<contrasena>

# MongoDB (opcional)
spring.data.mongodb.uri=mongodb://<host>:27017/gestion_gastos_audit

# Correo SMTP
spring.mail.username=<correo>
spring.mail.password=<app-password>
```

**3. Inicializar la base de datos:**  
Ejecutar los scripts SQL en el orden que indica la carpeta `Basesdedatos/`. El sistema usa `spring.jpa.hibernate.ddl-auto=none`, por lo que el esquema debe existir previamente.

**4. Ejecutar:**
```bash
mvn spring-boot:run
```
La API queda disponible en `http://localhost:8080/api`.

### Frontend

**1. Instalar dependencias:**
```bash
cd ThinWallet/Frontend
npm install
```

**2. Configurar variables de entorno (`.env`):**
```env
VITE_API_URL=http://localhost:8080/api
```

**3. Ejecutar en desarrollo:**
```bash
npm run dev
```
La aplicación queda disponible en `http://localhost:5173`.

**4. Generar build de producción:**
```bash
npm run build
```

---

## 5. Modelo de Base de Datos

ThinWallet usa una arquitectura **políglota de persistencia**: MySQL almacena todos los datos transaccionales y relacionales; MongoDB almacena notificaciones, actividad de círculos e indicadores analíticos.

### 5.1 Base de datos relacional — MySQL

**Base de datos:** `thinwallet_db`  
**Esquema DDL:** administrado manualmente (no auto-generado por Hibernate)

#### Tablas del sistema

| Tabla | Descripción |
|-------|-------------|
| `tipo_usuario` | Catálogo de roles (ej: Administrador, Usuario, Fantasma) |
| `tipo_movimiento` | Catálogo de tipos de movimiento (DEPOSITO, RETIRO) |
| `tipo_circulo` | Catálogo de tipos de grupo (Viaje, Hogar, Amigos, etc.) |
| `usuario` | Cuentas de usuario registradas |
| `categoria` | Categorías de gastos e ingresos |
| `circulo_gasto` | Grupos colaborativos de gasto |
| `usuario_circulo` | Relación N:M entre usuarios y círculos (tabla pivote) |
| `gasto` | Gastos programados y metas de ahorro |
| `usuario_gasto` | Relación N:M entre usuarios y gastos (tabla pivote) |
| `transaccion` | Movimientos financieros individuales |
| `deuda` | Deudas generadas entre usuarios |
| `auditoria_sistema` | Registro de acciones del sistema |

---

### 5.2 Diagrama Entidad–Relación

```
┌──────────────────┐       ┌─────────────────────────────────┐
│   tipo_usuario   │       │             usuario             │
│─────────────────-│       │─────────────────────────────────│
│ PK id_tipo_usuario│◄─────│ PK id_usuario                  │
│    nombre        │       │    nombres                      │
└──────────────────┘       │    apellidos                    │
                           │    nombre_usuario (UNIQUE)      │
                           │    correo (UNIQUE)              │
                           │    contrasena_hash              │
                           │    token_reclamo                │
                           │    descripcion                  │
                           │    fecha_registro               │
                           │    estado                       │
                           │ FK id_tipo_usuario              │
                           └───────────────┬─────────────────┘
                                           │
               ┌───────────────────────────┼───────────────────────────┐
               │                           │                           │
               ▼                           ▼                           ▼
┌───────────────────────┐  ┌─────────────────────────┐  ┌───────────────────────┐
│    usuario_circulo    │  │       transaccion        │  │         deuda         │
│───────────────────────│  │─────────────────────────│  │───────────────────────│
│ PK FK id_usuario      │  │ PK id_transaccion        │  │ PK id_deuda           │
│ PK FK id_circulo_gasto│  │    nombre               │  │    monto              │
│    rol_usuario        │  │    monto_original        │  │    metodo_pago_sugerido│
│    fecha_ingreso      │  │    moneda_original       │  │    porcentaje_division│
└──────┬────────────────┘  │    tasa_cambio          │  │    estado_pago        │
       │                   │    modalidad_division    │  │    fecha_creacion     │
       │                   │    contexto             │  │    fecha_confirmada   │
       ▼                   │    fecha_ejecucion      │  │    fecha_pago         │
┌──────────────────────┐   │ FK id_usuario           │  │ FK id_transaccion     │
│    circulo_gasto     │   │ FK id_circulo_gasto     │  │ FK id_usuario_deudor  │
│──────────────────────│   │ FK id_categoria         │  │ FK id_usuario_acreedor│
│ PK id_circulo_gasto  │   │ FK id_gasto             │  └───────────────────────┘
│    nombre            │   │ FK id_tipo_movimiento   │
│    moneda_base       │◄──│                         │
│    token_invitacion  │   └───────────────────────┬─┘
│    presupuesto_grupal│                           │
│    permite_mesadas   │                           ▼
│    permite_simplif.. │            ┌──────────────────────┐
│    estado            │            │    tipo_movimiento   │
│    fecha_creacion    │            │──────────────────────│
│ FK id_tipo_circulo   │◄─────────┐ │ PK id_tipo_movimiento│
│ FK id_usuario_creador│         │  │    nombre            │
└───────────┬──────────┘         │  └──────────────────────┘
            │                   │
            ▼          ┌────────┘
┌─────────────────┐    │
│   tipo_circulo  │    │        ┌──────────────────────────────┐
│─────────────────│    │        │            gasto             │
│ PK id_tipo_cir. │    │        │──────────────────────────────│
│    nombre       │    │        │ PK id_gasto                  │
└─────────────────┘    │        │    nombre                    │
                       │        │    valor                     │
                       │        │    periodicidad              │
           ┌───────────┘        │    fecha_inicio              │
           │                   │    fecha_fin                 │
           ▼                   │    monto_actual              │
┌────────────────────┐         │ FK id_usuario_creador        │
│  usuario_gasto     │         │ FK id_circulo_gasto          │
│────────────────────│         │ FK id_categoria              │
│ PK FK id_usuario   │         └──────────────────────────────┘
│ PK FK id_gasto     │
└────────────────────┘

┌──────────────────────────────────┐
│            categoria             │
│──────────────────────────────────│
│ PK id_categoria                  │
│    nombre                        │
│    descripcion                   │
│    tipo_categoria                │
│    exclusiva_perfil_solo         │
│    frecuencia_uso                │
│    estado                        │
│ FK id_circulo_gasto (nullable)   │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│         auditoria_sistema        │
│──────────────────────────────────│
│ PK id_auditoria                  │
│    id_usuario                    │
│    tabla_afectada                │
│    registro_id                   │
│    accion                        │
│    valores_anteriores (TEXT)     │
│    valores_nuevos (TEXT)         │
│    direccion_ip                  │
│    user_agent                    │
│    ruta_endpoint                 │
│    fecha_accion                  │
└──────────────────────────────────┘
```

---

### 5.3 Descripción de tablas

#### `tipo_usuario`
Catálogo estático de roles de usuario. Los IDs se asignan manualmente.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_tipo_usuario` | BIGINT | PK | Identificador del tipo |
| `nombre` | VARCHAR(50) | NOT NULL | Nombre del rol |

**Valores conocidos:** `1=Administrador`, `2=Usuario`, `3=Fantasma`

---

#### `tipo_movimiento`
Catálogo de tipos de transacción.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_tipo_movimiento` | BIGINT | PK, AUTO_INCREMENT | Identificador |
| `nombre` | VARCHAR(50) | NOT NULL | Nombre del movimiento |

**Valores conocidos:** `1=DEPOSITO`, `2=RETIRO`

---

#### `tipo_circulo`
Catálogo de categorías de grupos colaborativos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_tipo_circulo` | BIGINT | PK, AUTO_INCREMENT | Identificador |
| `nombre` | VARCHAR(50) | NOT NULL | Nombre del tipo |

**Valores de ejemplo:** `Viaje`, `Hogar`, `Amigos`, `Individual`

---

#### `usuario`
Tabla central de cuentas de usuario.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_usuario` | BIGINT | PK, AUTO_INCREMENT | Identificador único |
| `nombres` | VARCHAR | NULL | Nombres del usuario |
| `apellidos` | VARCHAR | NULL | Apellidos del usuario |
| `nombre_usuario` | VARCHAR | UNIQUE, NULL | Alias único de la cuenta |
| `correo` | VARCHAR | UNIQUE, NULL | Correo electrónico |
| `contrasena_hash` | VARCHAR | NULL | Contraseña encriptada (bcrypt) |
| `token_reclamo` | VARCHAR | NULL | Token para reclamar cuenta fantasma |
| `descripcion` | VARCHAR | NULL | Descripción personal opcional |
| `fecha_registro` | DATETIME | NULL | Fecha de creación de la cuenta |
| `estado` | INT | NULL | `0=Fantasma`, `1=Activo` |
| `id_tipo_usuario` | BIGINT | FK → tipo_usuario | Rol del usuario |

> **Nota:** Los usuarios fantasma (`estado=0`) son cuentas creadas automáticamente cuando se invita a alguien a un círculo. Tienen acceso parcial hasta que reclamen su perfil.

---

#### `categoria`
Categorías para clasificar transacciones y gastos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_categoria` | BIGINT | PK, AUTO_INCREMENT | Identificador |
| `nombre` | VARCHAR | NULL | Nombre de la categoría |
| `descripcion` | VARCHAR | NULL | Descripción |
| `tipo_categoria` | VARCHAR | NULL | `DEPOSITO`, `RETIRO` o `AMBOS` |
| `exclusiva_perfil_solo` | BOOLEAN | NULL | Si solo aplica en perfil personal |
| `frecuencia_uso` | INT | NULL | Contador de uso para ordenamiento |
| `estado` | INT | NULL | `1=Activo`, `0=Inactivo` |
| `id_circulo_gasto` | BIGINT | FK → circulo_gasto, NULL | Categoría personalizada por círculo |

---

#### `circulo_gasto`
Grupos colaborativos de gestión de gastos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_circulo_gasto` | BIGINT | PK, AUTO_INCREMENT | Identificador |
| `nombre` | VARCHAR | NULL | Nombre del grupo |
| `moneda_base` | VARCHAR | NULL | Moneda principal del grupo |
| `token_invitacion` | VARCHAR | NULL | Token hasheado para unirse al grupo |
| `presupuesto_grupal` | DECIMAL | NULL | Presupuesto máximo del grupo |
| `permite_mesadas` | BOOLEAN | NULL | Habilita envío de mesadas entre miembros |
| `permite_simplificacion_deudas` | BOOLEAN | NULL | Simplificación automática de deudas |
| `estado` | VARCHAR | NULL | Estado del círculo |
| `fecha_creacion` | DATETIME | NULL | Fecha de creación |
| `id_tipo_circulo` | BIGINT | FK → tipo_circulo, NULL | Tipo de grupo |
| `id_usuario_creador` | BIGINT | FK → usuario, NULL | Usuario que creó el grupo |

---

#### `usuario_circulo`
Tabla pivote N:M que registra la membresía de usuarios en círculos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_usuario` | BIGINT | PK (parte), FK → usuario | Identificador del usuario |
| `id_circulo_gasto` | BIGINT | PK (parte), FK → circulo_gasto | Identificador del círculo |
| `rol_usuario` | VARCHAR | NULL | Rol dentro del círculo |
| `fecha_ingreso` | DATETIME | NULL | Fecha de incorporación |

> **Clave primaria compuesta:** (`id_usuario`, `id_circulo_gasto`)

---

#### `gasto`
Registra gastos programados y metas de ahorro. La columna `periodicidad` determina el comportamiento:

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_gasto` | BIGINT | PK, AUTO_INCREMENT | Identificador |
| `nombre` | VARCHAR | NULL | Nombre descriptivo |
| `valor` | DECIMAL | NULL | Monto objetivo o monto del gasto |
| `periodicidad` | VARCHAR | NULL | Tipo de repetición (ver tabla de valores) |
| `fecha_inicio` | DATETIME | NULL | Inicio de vigencia |
| `fecha_fin` | DATETIME | NULL | Fin de vigencia (NULL = sin límite) |
| `monto_actual` | DECIMAL | NULL | Acumulado aportado (solo para metas) |
| `id_usuario_creador` | BIGINT | FK → usuario, NULL | Creador del gasto |
| `id_circulo_gasto` | BIGINT | FK → circulo_gasto, NULL | Círculo asociado (metas grupales) |
| `id_categoria` | BIGINT | FK → categoria, NULL | Categoría del gasto |

**Valores de `periodicidad`:**

| Valor | Significado |
|-------|-------------|
| `DIARIO` | Se repite cada día |
| `SEMANAL` | Se repite el mismo día de la semana |
| `MENSUAL` | Se repite el mismo día del mes |
| `TRIMESTRAL` | Se repite cada 3 meses |
| `ANUAL` | Se repite una vez al año |
| `GASTO` | Pago único sin repetición |
| `META` | Meta de ahorro activa (aprobada por el círculo) |
| `META_PROPUESTA` | Meta propuesta, pendiente de aprobación grupal |

---

#### `usuario_gasto`
Tabla pivote N:M entre usuarios y gastos (participantes en un gasto programado o meta).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_usuario` | BIGINT | PK (parte), FK → usuario | Identificador del usuario |
| `id_gasto` | BIGINT | PK (parte), FK → gasto | Identificador del gasto |

> **Clave primaria compuesta:** (`id_usuario`, `id_gasto`)

---

#### `transaccion`
Movimientos financieros individuales (ingresos y egresos).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_transaccion` | BIGINT | PK, AUTO_INCREMENT | Identificador |
| `nombre` | VARCHAR | NULL | Descripción del movimiento |
| `monto_original` | DECIMAL | NULL | Monto en la moneda original |
| `moneda_original` | VARCHAR | NULL | Código ISO de la moneda (COP, USD, EUR…) |
| `tasa_cambio` | DECIMAL | NULL | Tasa de conversión aplicada |
| `modalidad_division` | VARCHAR | NULL | Forma de dividir el gasto |
| `contexto` | VARCHAR | NULL | Contexto adicional libre |
| `fecha_ejecucion` | DATETIME | NOT NULL, AUTO | Fecha de registro (generada automáticamente) |
| `id_usuario` | BIGINT | FK → usuario, NULL | Usuario que registra la transacción |
| `id_circulo_gasto` | BIGINT | FK → circulo_gasto, NULL | Círculo asociado (si aplica) |
| `id_categoria` | BIGINT | FK → categoria, NULL | Categoría de la transacción |
| `id_gasto` | BIGINT | FK → gasto, NULL | Gasto programado asociado (si aplica) |
| `id_tipo_movimiento` | BIGINT | FK → tipo_movimiento, NULL | `1=DEPOSITO`, `2=RETIRO` |

---

#### `deuda`
Registro de deudas generadas entre usuarios, generalmente a partir de gastos compartidos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_deuda` | BIGINT | PK, AUTO_INCREMENT | Identificador |
| `monto` | DECIMAL | NULL | Monto de la deuda |
| `metodo_pago_sugerido` | VARCHAR | NULL | Método sugerido de pago |
| `porcentaje_division` | DECIMAL | NULL | Porcentaje del total que corresponde al deudor |
| `estado_pago` | VARCHAR | NULL | `PENDIENTE`, `PAGADA`, `RECHAZADA` |
| `fecha_creacion` | DATETIME | NULL | Fecha de creación de la deuda |
| `fecha_confirmada` | DATETIME | NULL | Fecha en que el acreedor confirmó el pago |
| `fecha_pago` | DATETIME | NULL | Fecha en que se realizó el pago |
| `id_transaccion` | BIGINT | FK → transaccion, NULL | Transacción que generó la deuda |
| `id_usuario_deudor` | BIGINT | FK → usuario, NULL | Usuario que debe |
| `id_usuario_acreedor` | BIGINT | FK → usuario, NULL | Usuario al que se le debe |

---

#### `auditoria_sistema`
Tabla de trazabilidad para auditar acciones críticas del sistema.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_auditoria` | INT | PK, AUTO_INCREMENT | Identificador |
| `id_usuario` | INT | FK → usuario, NULL | Usuario que realizó la acción (NULL para operaciones del sistema) |
| `tabla_afectada` | VARCHAR(50) | NOT NULL | Nombre de la tabla modificada |
| `registro_id` | VARCHAR(50) | NOT NULL | ID del registro afectado (puede ser compuesto, p.ej. `1_3`) |
| `accion` | VARCHAR(50) | NOT NULL | Tipo de acción. Valores usados: `INSERT`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `REGISTRO`, `VERIFICACION_CORREO`, `CAMBIO_CONTRASENA`, `CAMBIO_PASS_AUTH`, `CONFIRMAR_PAGO`, `DESACTIVAR`, `EXPULSAR_MIEMBRO`, `CIERRE_CICLO` |
| `valores_anteriores` | JSON | NULL | Estado previo del registro |
| `valores_nuevos` | JSON | NULL | Estado nuevo del registro |
| `direccion_ip` | VARCHAR(45) | NULL | IP del cliente |
| `user_agent` | VARCHAR(255) | NULL | Navegador/agente del cliente |
| `ruta_endpoint` | VARCHAR(255) | NULL | Endpoint que generó la acción |
| `fecha_accion` | TIMESTAMP | NULL, DEFAULT CURRENT_TIMESTAMP | Marca de tiempo de la acción |

---

### 5.4 Base de datos documental — MongoDB

**Base de datos:** `thinwallet_db`

MongoDB se utiliza para datos de alta frecuencia de escritura, consultas analíticas y notificaciones en tiempo real. Coexiste con MySQL sin reemplazarlo.

| Colección | Patrón de diseño | Descripción |
|-----------|-----------------|-------------|
| `notificaciones` | Documento simple | Alertas para usuarios |
| `actividad_circulo_diaria` | Bucket Pattern | Historial de eventos por círculo/día |
| `indicadores_circulo` | Approximation Pattern | Métricas analíticas agregadas |
| `categorias` | Documento simple | Espejo de categorías del sistema |

---

### 5.5 Descripción de colecciones

#### `notificaciones`

Almacena notificaciones individuales enviadas a usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | String | ID generado por MongoDB |
| `idUsuarioDestino` | Long | ID del usuario receptor |
| `titulo` | String | Título de la notificación |
| `mensaje` | String | Cuerpo del mensaje |
| `tipo` | String | Tipo de evento (ver tabla de tipos) |
| `idCirculoGasto` | Long | Círculo relacionado (opcional) |
| `nombreCirculo` | String | Nombre del círculo (opcional) |
| `leida` | Boolean | `false` = no leída |
| `fechaCreacion` | DateTime | Marca de tiempo de creación |

**Tipos de notificación:**

| Tipo | Descripción |
|------|-------------|
| `INVITACION_CIRCULO` | Invitación a unirse a un grupo |
| `GASTO_CIRCULO` | Nuevo gasto registrado en el grupo |
| `DEUDA_ASIGNADA` | Se asignó una deuda al usuario |
| `DEUDA_PAGADA` | Un deudor confirmó su pago |
| `META_CUMPLIDA` | Una meta de ahorro fue alcanzada |
| `EXPULSION_CIRCULO` | El usuario fue expulsado de un grupo |
| `META_GRUPAL_PROPUESTA` | Se propuso una meta grupal |
| `META_GRUPAL_ACTIVADA` | Una meta grupal fue aprobada |
| `META_GRUPAL_RECHAZADA` | Una meta grupal fue rechazada |
| `META_GRUPAL_CUMPLIDA` | Una meta grupal fue completada |
| `GASTO_PROGRAMADO_RECORDATORIO` | Recordatorio diario de pago programado |

---

#### `actividad_circulo_diaria`

Implementa el **Bucket Pattern** de MongoDB para agrupar eventos por círculo y día. Cada documento almacena hasta 500 eventos; cuando se llena, se crea un nuevo bucket con `bucketSeq` incrementado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | String | ID de MongoDB |
| `idCirculo` | Long | ID del círculo |
| `fechaBucket` | LocalDate | Fecha del agrupamiento |
| `bucketSeq` | Integer | Secuencia del bucket (0, 1, 2…) |
| `eventos` | Array | Lista de hasta 500 eventos |
| `totalEventos` | Integer | Contador de eventos en el bucket |
| `creadoEn` | DateTime | Fecha de creación del bucket |

**Estructura de cada evento (`EventoCirculo`):**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tipoEvento` | String | Tipo de evento (ver abajo) |
| `idUsuario` | Long | Usuario que generó el evento |
| `timestamp` | DateTime | Momento exacto del evento |
| `contexto` | Map<String, Object> | Datos variables según el tipo |

**Tipos de evento:**

| Tipo | Generado por | Actualiza contador |
|------|--------------|--------------------|
| `TRANSACCION_REALIZADA` | Registro de transacción | Sí |
| `DEUDA_GENERADA` | Creación de deuda | Sí |
| `DEUDA_PAGADA` | Confirmación de pago | Sí |
| `DEUDA_RECHAZADA` | Rechazo de pago | Sí |
| `GASTO_PROGRAMADO_CREADO` | Nuevo gasto programado o meta | Sí |
| `MESADA_ENVIADA` | Envío de mesada | Sí |
| `MIEMBRO_INVITADO` | Invitación a círculo | Sí |
| `MIEMBRO_EXPULSADO` | Expulsión de miembro | Sí |
| `CIRCULO_CREADO` | Creación del círculo | No |
| `CIRCULO_DESACTIVADO` | Desactivación del círculo | No |
| `MIEMBRO_UNIDO` | Usuario unido por token de invitación | No |
| `META_GRUPAL_PROPUESTA` | Propuesta de meta grupal | No |
| `META_GRUPAL_ACTIVADA` | Meta grupal aceptada por todos los miembros | No |
| `META_GRUPAL_RECHAZADA` | Meta grupal rechazada por algún miembro | No |
| `META_GRUPAL_CUMPLIDA` | Meta grupal alcanzada al 100% | No |

---

#### `indicadores_circulo`

Implementa el **Approximation Pattern**: las métricas no se recalculan en cada operación, sino cuando el contador de eventos sin persistir supera el umbral (`umbralPersistencia=10` por defecto).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | String | ID de MongoDB |
| `idCirculo` | Long | ID del círculo |
| `contadores` | Objeto | Contadores totales por tipo de evento |
| `indicadores` | Objeto | Métricas calculadas |
| `categoriasMasUsadas` | Array | Top categorías con nombre, cantidad y porcentaje |
| `miembroMasActivo` | Long | ID del usuario más activo |
| `umbralPersistencia` | Integer | Eventos acumulados antes de recalcular |
| `ultimaActualizacion` | DateTime | Última vez que se recalcularon las métricas |

**Indicadores calculados:**

| Indicador | Valores posibles | Descripción |
|-----------|-----------------|-------------|
| `tasa_friccion` | `BAJO / MEDIO / ALTO` | Proporción de deudas rechazadas vs pagadas |
| `nivel_actividad` | `NUEVO / DORMIDO / POCO_ACTIVO / ACTIVO / MUY_ACTIVO` | Transacciones en el último mes |
| `salud_circulo` | `EXCELENTE / BUENO / REGULAR / CRITICO` | Puntuación compuesta del grupo |

---

## 6. Catálogo de Endpoints — API REST

**URL base:** `http://localhost:8080/api`  
**Formato:** JSON  
**Autenticación:** Sin JWT; el cliente mantiene la sesión en `localStorage`.

---

### 6.1 Autenticación y Usuarios — `/api/usuarios`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/register` | Registrar nuevo usuario |
| `POST` | `/login` | Iniciar sesión con correo y contraseña |
| `POST` | `/login-token` | Iniciar sesión con token de invitación |
| `POST` | `/verify` | Verificar código de activación enviado al correo |
| `POST` | `/reenviar-verificacion` | Reenviar código de verificación |
| `POST` | `/recuperar-contrasena` | Solicitar código de recuperación de contraseña |
| `POST` | `/verificar-codigo` | Verificar código de recuperación |
| `POST` | `/cambiar-contrasena` | Cambiar contraseña con código de recuperación |
| `POST` | `/reclamar-perfil` | Convertir cuenta fantasma en cuenta completa |
| `GET` | `/{id}` | Obtener usuario por ID |
| `GET` | `/correo/{correo}` | Obtener usuario por correo |
| `GET` | `/{id}/saldo` | Obtener saldo total del usuario |
| `GET` | `/buscar` | Buscar usuarios registrados (parámetro `q`) |
| `PATCH` | `/{id}/perfil` | Actualizar nombre, apellidos, nombre de usuario y descripción |
| `PUT` | `/{id}/cambiar-contrasena` | Cambiar contraseña estando autenticado |
| `DELETE` | `/{id}` | Eliminar usuario |

**Body de registro:**
```json
{
  "nombres": "Ana",
  "apellidos": "García",
  "nombreUsuario": "anagarcia",
  "correo": "ana@ejemplo.com",
  "contrasena": "MiClave123"
}
```

**Body de login:**
```json
{
  "correo": "ana@ejemplo.com",
  "contrasena": "MiClave123"
}
```

---

### 6.2 Transacciones — `/api/transacciones`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/usuario/{idUsuario}` | Listar transacciones de un usuario |
| `GET` | `/circulo/{idCirculo}` | Listar transacciones de un círculo |
| `GET` | `/{id}` | Obtener transacción por ID |
| `GET` | `/gastos-hormiga/{idUsuario}` | Detectar micro-gastos (umbral y días configurables) |
| `POST` | `/` | Registrar nueva transacción |
| `PUT` | `/{id}` | Actualizar transacción |
| `DELETE` | `/{id}` | Eliminar transacción |

**Body de creación:**
```json
{
  "nombre": "Almuerzo",
  "montoOriginal": 15000,
  "monedaOriginal": "COP",
  "idUsuario": 1,
  "idCategoria": 5,
  "idTipoMovimiento": 2
}
```

---

### 6.3 Gastos Programados y Metas — `/api/gastos`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/programados/usuario/{idUsuario}` | Gastos programados del usuario |
| `GET` | `/metas/usuario/{idUsuario}` | Metas de ahorro del usuario |
| `GET` | `/circulo/{idCirculoGasto}` | Gastos asociados a un círculo |
| `GET` | `/circulo/{id}/metas-grupales` | Metas grupales del círculo |
| `GET` | `/{id}` | Obtener gasto por ID |
| `POST` | `/` | Crear gasto programado o meta |
| `POST` | `/circulo/{id}/meta-grupal?idUsuario={id}` | Proponer meta grupal |
| `PUT` | `/{id}` | Actualizar gasto |
| `PUT` | `/{id}/meta-grupal/aceptar?idUsuario={id}` | Votar a favor de una meta grupal |
| `PUT` | `/{id}/meta-grupal/rechazar?idUsuario={id}` | Votar en contra de una meta grupal |
| `PUT` | `/{id}/meta-grupal/abonar?idUsuario={id}&monto={n}` | Abonar a una meta grupal |
| `DELETE` | `/{id}` | Eliminar gasto |

**Body de gasto programado:**
```json
{
  "nombre": "Netflix",
  "valor": 49900,
  "periodicidad": "MENSUAL",
  "fechaInicio": "2025-01-01T00:00:00",
  "fechaFin": "2026-01-01T00:00:00",
  "idUsuarioCreador": 1,
  "idCategoria": 8
}
```

---

### 6.4 Círculos de Gasto — `/api/circulos-gasto`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/usuario/{idUsuario}` | Círculos del usuario (creados o como miembro) |
| `GET` | `/miembro/{idUsuario}` | Círculos donde el usuario es miembro |
| `GET` | `/{id}/detalle` | Detalle completo del círculo con miembros |
| `GET` | `/{idCirculo}/miembros` | Listar miembros del círculo |
| `GET` | `/invitacion/{token}` | Buscar círculo por token de invitación |
| `POST` | `/` | Crear nuevo círculo |
| `POST` | `/unirse` | Unirse a un círculo con token |
| `POST` | `/{id}/invitar-registrado` | Invitar a usuario registrado por ID |
| `PUT` | `/{id}` | Actualizar datos del círculo |
| `DELETE` | `/{id}` | Eliminar círculo |
| `DELETE` | `/{idCirculo}/expulsar/{idUsuario}` | Expulsar miembro del círculo |

---

### 6.5 Deudas — `/api/deudas`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/deudor/{idUsuario}` | Deudas donde el usuario es deudor |
| `GET` | `/acreedor/{idUsuario}` | Deudas donde el usuario es acreedor |
| `GET` | `/{id}` | Obtener deuda por ID |
| `POST` | `/` | Crear deuda |
| `PUT` | `/{id}` | Actualizar deuda |
| `PUT` | `/{id}/confirmar` | Confirmar pago de deuda |
| `PUT` | `/{id}/rechazar` | Rechazar pago de deuda |
| `DELETE` | `/{id}` | Eliminar deuda |

---

### 6.6 Notificaciones — `/api/notificaciones`

> Disponible únicamente si MongoDB está activo.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/usuario/{idUsuario}` | Listar notificaciones del usuario |
| `GET` | `/usuario/{idUsuario}/no-leidas-count` | Contar notificaciones no leídas |
| `PUT` | `/{id}/leer` | Marcar notificación como leída |
| `PUT` | `/usuario/{idUsuario}/leer-todas` | Marcar todas como leídas |
| `DELETE` | `/{id}` | Eliminar notificación |

---

### 6.7 Categorías — `/api/categorias`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Listar todas las categorías |
| `GET` | `/{id}` | Obtener categoría por ID |
| `GET` | `/circulo/{idCirculoGasto}` | Categorías de un círculo |
| `POST` | `/` | Crear categoría |
| `PUT` | `/{id}` | Actualizar categoría |
| `DELETE` | `/{id}` | Eliminar categoría |

---

### 6.8 Reportes — `/api/reportes`

| Método | Endpoint | Descripción | Respuesta |
|--------|----------|-------------|-----------|
| `GET` | `/pdf/{idUsuario}` | Reporte financiero del usuario | `application/pdf` |
| `GET` | `/csv/{idUsuario}` | Exportar transacciones | `text/csv` |

---

## 7. Manual de Usuario

### 7.1 Registro e inicio de sesión

**Registrarse:**
1. Ir a la pantalla de inicio → **Crear Cuenta**.
2. Completar nombres, apellidos, nombre de usuario, correo y contraseña (mínimo 8 caracteres, una mayúscula y un número).
3. Revisar el correo electrónico y copiar el código de verificación de 6 dígitos.
4. Ingresar el código en la pantalla de verificación.

**Iniciar sesión:**
1. Ingresar correo y contraseña → **Iniciar Sesión**.
2. Si se tiene un token de invitación (de un círculo), usar **Entrar con Token** para acceder directamente como usuario fantasma.

**Recuperar contraseña:**
1. Pantalla de login → **¿Olvidó contraseña?**
2. Ingresar correo → recibirá un código.
3. Ingresar el código → ingresar la nueva contraseña.

---

### 7.2 Dashboard

El dashboard muestra un resumen de la situación financiera del usuario:
- Saldo total (suma de ingresos menos egresos).
- Últimas transacciones.
- Indicadores de gastos por categoría.
- Acceso rápido a las funciones principales.

---

### 7.3 Transacciones

**Registrar una transacción:**
1. Tocar el botón **AÑADIR** en la barra de navegación.
2. Seleccionar el tipo: **Depósito** (ingreso) o **Retiro** (egreso).
3. Seleccionar el método de pago y la categoría.
4. Ingresar el monto y una descripción.
5. Seleccionar la moneda (COP por defecto).
6. Confirmar con **Registrar**.

> Los usuarios fantasma solo pueden registrar depósitos. Los retiros están restringidos hasta reclamar la cuenta.

**Ver historial:**
- Sección **Mis Transacciones**: lista ordenada de más reciente a más antigua.
- Se muestra tipo, categoría, monto y fecha de cada movimiento.

---

### 7.4 Círculos de Gasto

**Crear un círculo:**
1. Sección **GRUPOS** → **+ Crear**.
2. Asignar nombre (mínimo 3 caracteres) y tipo.
3. Agregar invitados por nombre de usuario (opcional).
4. Copiar y compartir el **token de invitación** generado.

**Unirse a un círculo:**
1. **GRUPOS** → **Unirse**.
2. Pegar el token de invitación recibido.

**Dentro del círculo:**
- Ver historial de gastos compartidos con autor y fecha.
- Registrar gastos del grupo (nombre, monto, categoría).
- Gestionar metas grupales de ahorro.
- Expulsar miembros (solo el creador del círculo).

---

### 7.5 Metas Grupales

**Proponer una meta:**
1. Dentro del círculo → sección **Metas Grupales** → **Proponer Meta**.
2. Ingresar nombre y monto objetivo.
3. La meta queda en estado **Propuesta** hasta que todos los miembros voten.

**Votar sobre una meta propuesta:**
- Botón **Aceptar** o **Rechazar** visible para todos los miembros (incluidos fantasmas).
- Cuando todos aceptan, la meta pasa a **Activa**.

**Abonar a una meta activa:**
- Botón **Abonar** → ingresar el monto (no puede superar el restante).
- El monto se acumula en `monto_actual` hasta alcanzar el `valor` objetivo.

**Editar / Eliminar una meta:**
- Solo el creador del círculo puede editar nombre y monto, o eliminar la meta.

---

### 7.6 Gastos Programados

**Crear un gasto programado:**
1. Perfil → **Gastos Programados** → **Nuevo**.
2. Nombre, monto, categoría.
3. Seleccionar periodicidad: Diario, Semanal, Mensual, Trimestral, Anual o Único.
4. La fecha de fin se calcula automáticamente (un ciclo adelante), pero puede modificarse.

El sistema envía una notificación diaria (a las 8:00 AM) recordando los pagos que corresponden a ese día según la periodicidad configurada.

---

### 7.7 Deudas

- Sección **DEUDAS**: muestra deudas pendientes como deudor y como acreedor.
- Para crear una deuda, seleccionar el acreedor y el monto.
- El acreedor puede **confirmar** el pago (marca la deuda como pagada) o **rechazarla**.
- Los campos informativos incluyen el método de pago sugerido y el porcentaje de división.

---

### 7.8 Reportes

1. Sección **REPORTES**.
2. Ver gráficas y estadísticas de gastos por categoría y período.
3. Descargar reporte en **PDF** o **CSV** desde el perfil.

---

### 7.9 Perfil

- **Editar Perfil:** nombres, apellidos, nombre de usuario y descripción.
- **Cambiar Contraseña:** requiere contraseña actual y nueva (mínimo 8 caracteres, mayúscula y número).
- **Moneda Preferida:** seleccionar moneda de visualización; todos los valores se convierten.
- **Tu ID de Usuario:** copiarlo para que otros te agreguen como acreedor en deudas.
- **Gastos Programados:** acceso directo al gestor de pagos recurrentes.
- **Reclamar Perfil** *(solo usuarios fantasma)*: registrar datos completos para convertir la cuenta invitada en cuenta normal.

---

## 8. Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| **Contraseña segura** | Mínimo 8 caracteres, al menos una mayúscula y un número |
| **Usuario fantasma** | `estado=0`; puede ver grupos y votar metas, pero no accede a Dashboard, Metas personales ni Reportes |
| **Reclamar perfil** | Un fantasma puede registrar correo y contraseña propios; el token de reclamo se invalida tras usarse |
| **Token de invitación** | Se almacena hasheado en BD; el token original solo se retorna en la respuesta de creación |
| **Abono a meta** | No puede superar el monto restante (`valor - monto_actual`); validado en frontend y backend |
| **Meta aprobada** | Requiere aceptación de todos los miembros del círculo para activarse |
| **Gastos programados** | Recordatorio automático diario a las 8:00 AM por periodicidad (`DIARIO/SEMANAL/MENSUAL/TRIMESTRAL/ANUAL`) |
| **Expulsión de miembro** | Solo el creador del círculo puede expulsar; genera evento `MIEMBRO_EXPULSADO` en MongoDB |
| **Eliminación de círculo** | Elimina el círculo y sus gastos asociados (acción irreversible) |
| **Orden de transacciones** | Se muestran de más reciente a más antigua por `id_transaccion` DESC |
| **Moneda multi-divisas** | Las transacciones guardan `moneda_original` y `tasa_cambio`; la visualización se convierte a la moneda preferida del usuario |
| **Notificaciones** | Solo activas si MongoDB está disponible; el sistema opera sin ellas si el endpoint devuelve 404 |

---

*Documentación generada para el proyecto ThinWallet — Universidad El Bosque.*
