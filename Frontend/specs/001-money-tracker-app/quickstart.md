# Quickstart: Money Tracker App

## Requisitos previos

- Node.js 18+
- npm o yarn

## Instalacion

```bash
# Instalar dependencias
npm install

# O si usas yarn
yarn install
```

## Configuracion

Crear archivo `.env` en la raiz:

```env
VITE_API_URL=http://localhost:3000/api
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

La app estara disponible en `http://localhost:5173`

## Estructura de archivos

```
src/
├── assets/           # Imagenes y recursos
├── components/       # Componentes reutilizables
│   ├── common/       # Botones, inputs, cards
│   └── layout/       # Header, footer, layout
├── pages/            # Pantallas
│   ├── Auth/         # Login, registro
│   ├── Dashboard/    # Panel principal
│   └── Transactions/ # Transacciones
├── services/         # Llamados API
├── context/          # Estado global
├── hooks/            # Custom hooks
└── types/            # TypeScript types
```

## Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Iniciar desarrollo |
| `npm run build` | Build produccion |
| `npm run preview` | Preview produccion |
| `npm test` | Ejecutar tests |
| `npm run lint` | Verificar codigo |

## Primeros pasos para desarrollo

1. Ejecutar `npm run dev`
2. La app se conecta al backend en `VITE_API_URL`
3. Credenciales de prueba se crean via registro