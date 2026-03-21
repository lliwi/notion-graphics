# Notion Graphics

Plataforma web para generar gráficos embebibles a partir de bases de datos de Notion. Los usuarios conectan su cuenta de Notion, seleccionan una base de datos, configuran el gráfico visualmente y obtienen un enlace iframe listo para insertar en cualquier página de Notion.

---

## Índice

1. [Arquitectura](#arquitectura)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Variables de entorno](#variables-de-entorno)
5. [Desarrollo local](#desarrollo-local)
6. [Despliegue en producción](#despliegue-en-producción)
7. [Integración con Notion](#integración-con-notion)
8. [API](#api)
9. [Tipos de gráfico y configuración](#tipos-de-gráfico-y-configuración)

---

## Arquitectura

```
Browser → Next.js (frontend :3001)
             │  /api/* proxy
             ▼
         NestJS (backend :3000)
             │
        ┌────┴────┐
        │         │
   PostgreSQL   Notion API
```

El frontend actúa como proxy: las llamadas del browser a `/api/*` se reescriben internamente hacia el backend (`http://backend:3000`). Así solo se expone un único dominio hacia el exterior y se evitan problemas de CORS.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15, TailwindCSS, Chart.js, react-chartjs-2 |
| Backend | NestJS, TypeORM, class-validator |
| Base de datos | PostgreSQL 16 |
| Auth | JWT (Bearer token), bcrypt |
| Notion | OAuth 2.0, `@notionhq/client` v5 |
| Infra | Docker Compose, Cloudflare Tunnel |

---

## Estructura del proyecto

```
notion-graphics/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── app/            # Rutas (dashboard, charts/[id], login, register)
│   │   ├── components/     # ChartPreview, CustomizationPanel, EmbedCodeBox...
│   │   ├── hooks/          # useChart, useChartData, useNotionProperties
│   │   ├── lib/            # api.ts (axios), chartjs.ts
│   │   └── types/          # index.ts — ChartConfig, Chart, ChartType...
│   ├── next.config.ts      # Rewrites /api/* → backend, /embed/*, /notion-lp/*
│   └── Dockerfile
├── backend/
│   └── src/
│       ├── auth/           # Register, login, JWT strategy
│       ├── charts/         # CRUD, publish/unpublish, data endpoint
│       ├── embed/          # GET /embed/:token — render iframe sin auth
│       ├── integrations/
│       │   └── notion/     # OAuth flow, listado de DBs
│       ├── notion-data/    # QueryDatabase + agregaciones
│       ├── users/          # Entidad User
│       ├── database/       # TypeORM DataSource + migraciones
│       └── main.ts         # Bootstrap, CORS, ValidationPipe
├── docker-compose.yml      # Entorno de desarrollo
├── docker-compose.prod.yml # Entorno de producción
├── .env                    # Variables de entorno (no en git)
└── .env.example
```

---

## Variables de entorno

Copia `.env.example` como `.env` y rellena los valores:

```env
# PostgreSQL
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=charts

# Backend
DATABASE_URL=postgres://user:password@postgres:5432/charts
JWT_SECRET=mínimo_32_caracteres
JWT_EXPIRES_IN=7d
PORT=3000

# Notion OAuth — integración de login de usuario (sin Link Preview)
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=https://tu-dominio.com/api/integrations/notion/callback

# URLs
APP_BASE_URL=https://tu-dominio.com,http://localhost:3001
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_EMBED_BASE_URL=https://tu-dominio.com
EMBED_BASE_URL=https://tu-dominio.com

# Notion LP (integración Link Preview / oEmbed — separada del login)
NOTION_LP_CLIENT_ID=
NOTION_LP_CLIENT_SECRET=
```

> **Importante:** `NOTION_CLIENT_ID` debe ser una integración pública de Notion **sin** "Vista previa del enlace" activada. Si la misma integración tiene external auth configurado, Notion devuelve `invalid_grant: Please provide external_account info` al intentar el login.

---

## Desarrollo local

Requiere Docker y Docker Compose.

```bash
# 1. Clonar y configurar entorno
cp .env.example .env
# editar .env con tus credenciales

# 2. Levantar servicios (hot-reload activo)
docker compose up

# 3. Ver logs del backend
docker logs notion_charts_backend -f

# 4. Ver logs del frontend
docker logs notion_charts_frontend -f
```

El backend corre migraciones automáticamente al arrancar. Accede en:

- Frontend: http://localhost:3001
- Backend: http://localhost:3000

### Comandos útiles en desarrollo

```bash
# Generar una nueva migración (con la DB activa)
docker exec notion_charts_backend npm run migration:generate -- src/database/migrations/NombreMigracion

# Aplicar migraciones manualmente
docker exec notion_charts_backend npm run migration:run

# Instalar un paquete en el backend
docker run --rm -v "$(pwd)/backend":/app -w /app node:20-alpine sh -c \
  "npm install <paquete> && chown -R $(id -u):$(id -g) /app"

# Instalar un paquete en el frontend
docker run --rm -v "$(pwd)/frontend":/app -w /app node:20-alpine sh -c \
  "npm install <paquete> && chown -R $(id -u):$(id -g) /app"
```

> Los archivos creados dentro de Docker pertenecen a root. El `chown` al final corrige los permisos para el usuario del host.

---

## Despliegue en producción

### Requisitos

- Docker y Docker Compose en el servidor
- Cloudflare Tunnel (`cloudflared`) configurado para exponer el frontend
- `.env` con valores de producción

### Configuración de red

El `docker-compose.prod.yml` usa una red macvlan externa (`int-lan`) que asigna una IP fija al contenedor del frontend (`192.168.0.29`). Cloudflare Tunnel apunta a esa IP en el puerto `3001`.

Si `cloudflared` corre en un servidor distinto, asegúrate de que la IP macvlan es alcanzable desde él. Problemas de caché ARP pueden causar 502 intermitentes — reiniciar `cloudflared` los resuelve.

### Despliegue

```bash
# Build y arranque en producción
docker compose -f docker-compose.prod.yml up -d --build

# Ver estado
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker logs notion_charts_backend -f
docker logs notion_charts_frontend -f
```

Las migraciones se aplican automáticamente al arrancar el backend (definido en el CMD del Dockerfile de producción).

### Redis (opcional)

Redis está disponible pero desactivado por defecto. Para activarlo:

```bash
docker compose -f docker-compose.prod.yml --profile with-redis up -d
```

---

## Integración con Notion

### Integraciones necesarias

El proyecto requiere **dos integraciones separadas** en [notion.so/profile/integrations](https://www.notion.so/profile/integrations):

#### 1. Integración de login de usuario

- Tipo: **Público**
- Sin "Vista previa del enlace"
- URI de redireccionamiento: `https://tu-dominio.com/api/integrations/notion/callback`
- Permisos: _Leer información de usuario, incluidas direcciones de correo electrónico_
- Las credenciales van en `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET`

#### 2. Integración Link Preview / oEmbed (opcional)

- Tipo: **Público** con "Vista previa del enlace" activada
- URL de autorización de OAuth: `https://tu-dominio.com/embed/oembed`
- URL de token: `https://tu-dominio.com/notion-lp/token`
- Las credenciales van en `NOTION_LP_CLIENT_ID` / `NOTION_LP_CLIENT_SECRET`

> Mezclar ambos flujos en la misma integración provoca el error `invalid_grant: Please provide external_account info`.

### Flujo OAuth de login

```
1. Browser → GET /api/integrations/notion/login
2. Redirect → https://api.notion.com/v1/oauth/authorize?...&state=<JWT>
3. Usuario autoriza en Notion
4. Notion → GET /api/integrations/notion/callback?code=...&state=...
5. Backend valida state JWT, intercambia code por access_token
6. Backend guarda token, devuelve JWT de sesión al frontend
7. Frontend almacena JWT en localStorage
```

---

## API

### Auth

```
POST /auth/register        { name, email, password }
POST /auth/login           { email, password }
```

### Notion

```
GET  /integrations/notion/login       Inicia OAuth
GET  /integrations/notion/callback    Callback OAuth
GET  /integrations/notion/databases   Lista DBs conectadas
POST /integrations/notion/disconnect  Revoca integración
```

### Charts

```
GET    /charts                Listar gráficos del usuario
POST   /charts                Crear gráfico
GET    /charts/:id            Obtener gráfico
PUT    /charts/:id            Actualizar gráfico
DELETE /charts/:id            Eliminar gráfico
GET    /charts/:id/data       Consultar datos de Notion para el gráfico
POST   /charts/:id/publish    Publicar (genera embed_token)
POST   /charts/:id/unpublish  Despublicar
```

### Embed (sin autenticación)

```
GET /embed/:token    Renderiza el gráfico como iframe
```

---

## Tipos de gráfico y configuración

### Tipos soportados

| Valor | Descripción |
|-------|-------------|
| `bar` | Barras verticales |
| `bar_horizontal` | Barras horizontales |
| `line` | Líneas |
| `area` | Área |
| `pie` | Tarta |
| `donut` | Donut |
| `radar` | Radar |
| `table` | Tabla |
| `kpi` | KPI (valor único) |

### Campos de `config_json`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `database_id` | `string` | UUID de la base de datos de Notion |
| `title` | `string` | Título visible del gráfico |
| `x_field` | `string` | Campo de Notion para el eje X |
| `y_field` | `string` | Campo de Notion para el eje Y |
| `aggregation` | `sum\|count\|avg\|none` | Función de agregación |
| `colors` | `string[]` | Array de colores hex |
| `legend_position` | `top\|bottom\|left\|right\|none` | Posición de la leyenda |
| `background` | `string` | Color de fondo del embed |
| `font_family` | `system-ui\|serif\|monospace` | Tipografía |
| `font_size` | `number` | Tamaño de fuente en px (8–24) |
| `chart_height` | `number` | Alto del gráfico en px (150–800) |
| `bar_width` | `number` | Ancho de las barras en % (10–100) |
| `show_grid` | `boolean` | Mostrar cuadrícula |
| `border_radius` | `number` | Radio de borde en px (0–20) |
| `radar_label_field` | `string` | Campo etiqueta para radar |
| `radar_axes` | `string[]` | Campos de los ejes del radar |

### Propiedades de Notion soportadas

`title`, `rich_text`, `number`, `select`, `multi_select`, `date`, `checkbox`, `formula`
