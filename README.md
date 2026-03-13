# Notion Charts Service

Servicio web para generar gráficos a partir de bases de datos de Notion
y mostrarlos embebidos dentro de páginas de Notion mediante enlaces
embebibles.

------------------------------------------------------------------------

# Tabla de contenidos

1.  Introducción\
2.  Objetivo del proyecto\
3.  Alcance\
4.  Arquitectura del sistema\
5.  Tecnologías sugeridas\
6.  Funcionalidades principales\
7.  Gestión de usuarios\
8.  Integración con Notion\
9.  Sistema de gráficos\
10. Galería de gráficos\
11. Sistema de enlaces embebibles\
12. API del sistema\
13. Modelo de datos\
14. Seguridad\
15. Requerimientos no funcionales\
16. Despliegue con Docker Compose\
17. Variables de entorno\
18. Flujo funcional principal\
19. Roadmap de desarrollo\
20. Criterios de aceptación

------------------------------------------------------------------------

# 1. Introducción

Notion Charts Service es una plataforma que permite generar
visualizaciones de datos basadas en bases de datos de Notion.

El sistema permite:

-   conectar cuentas de Notion
-   seleccionar bases de datos
-   configurar gráficos de forma visual
-   generar enlaces embebibles
-   insertar dichos enlaces en páginas de Notion para visualizar los
    gráficos en tiempo real.

Los gráficos se renderizan mediante una página optimizada para **embeds
/ iframe** compatible con Notion.

------------------------------------------------------------------------

# 2. Objetivo del proyecto

Desarrollar una plataforma que permita a usuarios crear gráficos a
partir de datos almacenados en Notion sin necesidad de herramientas
externas de BI.

Objetivos:

-   simplificar la visualización de datos de Notion
-   generar gráficos fácilmente embebibles
-   ofrecer una interfaz visual para configurar gráficos
-   permitir reutilizar gráficos en múltiples páginas de Notion

------------------------------------------------------------------------

# 3. Alcance

El sistema incluye:

-   autenticación y gestión de usuarios
-   integración con Notion mediante API oficial
-   acceso a bases de datos autorizadas
-   configuración visual de gráficos
-   generación de enlaces embebibles
-   galería de gráficos
-   despliegue mediante Docker Compose

------------------------------------------------------------------------

# 4. Arquitectura del sistema

Arquitectura de tres capas:

Frontend → Backend API → Base de Datos

Componentes principales:

-   Frontend (React / Next.js)
-   Backend API (Node.js / NestJS)
-   PostgreSQL
-   Redis (opcional para caché)

------------------------------------------------------------------------

# 5. Tecnologías sugeridas

## Frontend

-   React / Next.js
-   TailwindCSS
-   Chart.js / ECharts / Recharts

## Backend

-   Node.js
-   NestJS o Express
-   API REST
-   OAuth 2.0 (Notion)

## Base de datos

-   PostgreSQL

## Infraestructura

-   Docker
-   Docker Compose
-   Nginx (opcional)

------------------------------------------------------------------------

# 6. Funcionalidades principales

El sistema debe permitir:

-   crear cuentas de usuario
-   conectar cuentas de Notion
-   seleccionar bases de datos
-   configurar gráficos mediante interfaz visual
-   visualizar preview del gráfico
-   publicar gráficos
-   generar enlaces embebibles
-   gestionar gráficos desde una galería

------------------------------------------------------------------------

# 7. Gestión de usuarios

## Registro

Usuarios pueden registrarse con:

-   email
-   contraseña

Opcional:

-   login con Google

## Roles

Roles mínimos:

-   ADMIN
-   USER

------------------------------------------------------------------------

# 8. Integración con Notion

La integración se realiza mediante la API oficial.

Funciones:

-   conexión OAuth
-   listado de bases de datos
-   lectura de propiedades
-   consulta de registros

Tipos soportados:

-   text
-   number
-   select
-   multi-select
-   date
-   checkbox

------------------------------------------------------------------------

# 9. Sistema de gráficos

Tipos iniciales:

-   Bar Chart
-   Line Chart
-   Pie Chart
-   Donut Chart
-   Table
-   KPI

Configuraciones:

-   título
-   eje X
-   eje Y
-   series
-   filtros
-   agregaciones
-   colores
-   leyenda

------------------------------------------------------------------------

# 10. Galería de gráficos

La galería permite:

-   visualizar gráficos creados
-   editar gráficos
-   duplicar
-   eliminar
-   copiar enlace embed

------------------------------------------------------------------------

# 11. Sistema de enlaces embebibles

Cada gráfico genera un enlace:

    https://charts.app/embed/{chart_token}

Este endpoint renderiza únicamente el gráfico para ser usado como embed.

------------------------------------------------------------------------

# 12. API del sistema

## Auth

    POST /auth/register
    POST /auth/login
    POST /auth/logout
    POST /auth/forgot-password

## Notion

    GET /integrations/notion/connect
    GET /integrations/notion/callback
    GET /integrations/notion/databases
    POST /integrations/notion/disconnect

## Charts

    GET /charts
    POST /charts
    GET /charts/:id
    PUT /charts/:id
    DELETE /charts/:id
    POST /charts/:id/publish
    GET /charts/:id/preview

## Embed

    GET /embed/:token

------------------------------------------------------------------------

# 13. Modelo de datos

## User

-   id
-   name
-   email
-   password_hash
-   role
-   status
-   created_at

## Chart

-   id
-   user_id
-   name
-   type
-   config_json
-   embed_token
-   published

------------------------------------------------------------------------

# 14. Seguridad

-   contraseñas con bcrypt / argon2
-   tokens cifrados
-   HTTPS obligatorio
-   protección contra XSS y CSRF

------------------------------------------------------------------------

# 15. Requerimientos no funcionales

-   rendimiento optimizado para embeds
-   uso de caché
-   logs estructurados
-   arquitectura escalable

------------------------------------------------------------------------

# 16. Despliegue con Docker Compose

Servicios:

-   frontend
-   backend
-   postgres
-   redis (opcional)

Estructura:

    project/
     ├ frontend/
     ├ backend/
     ├ docker-compose.yml
     ├ .env

Script start.sh que inicie el proyecto y aplique migraciones si es necesario

------------------------------------------------------------------------

# 17. Variables de entorno

Ejemplo:

    DATABASE_URL=postgres://user:password@postgres:5432/charts
    JWT_SECRET=secret

    NOTION_CLIENT_ID=
    NOTION_CLIENT_SECRET=
    NOTION_REDIRECT_URI=

    APP_BASE_URL=http://localhost:3000
    EMBED_BASE_URL=http://localhost:4000

------------------------------------------------------------------------

# 18. Flujo funcional

1.  Usuario crea cuenta
2.  Inicia sesión
3.  Conecta Notion
4.  Selecciona base de datos
5.  Configura gráfico
6.  Publica gráfico
7.  Copia enlace embed
8.  Inserta enlace en Notion

------------------------------------------------------------------------

# 19. Roadmap

## Fase 1

-   autenticación
-   conexión Notion
-   lectura de datos

## Fase 2

-   motor de gráficos
-   preview
-   embeds

## Fase 3

-   galería
-   duplicado
-   filtros

------------------------------------------------------------------------

# 20. Criterios de aceptación

El sistema será válido cuando:

-   usuario puede registrarse
-   puede conectar Notion
-   puede crear gráfico
-   puede generar embed
-   el embed funciona en Notion
-   el sistema se despliega con Docker Compose
