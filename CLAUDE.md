# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Notion Charts Service** — a web platform that generates embeddable charts from Notion databases. Users connect their Notion accounts, select databases, configure charts visually, and embed the resulting charts in Notion pages via iframe-compatible links (`https://charts.app/embed/{chart_token}`).

## Architecture

Three-layer architecture:

```
Frontend (Next.js) → Backend API (NestJS) → PostgreSQL
                                          → Redis (cache, optional)
```

**Monorepo structure** (planned):
```
project/
 ├── frontend/     # Next.js + TailwindCSS + chart library
 ├── backend/      # NestJS REST API
 ├── docker-compose.yml
 ├── .env
 └── start.sh      # Starts services and applies DB migrations
```

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React / Next.js, TailwindCSS, Chart.js / ECharts / Recharts |
| Backend | Node.js, NestJS, REST API, OAuth 2.0 (Notion) |
| Database | PostgreSQL |
| Auth | JWT, bcrypt/argon2 |
| Infra | Docker Compose, Nginx (optional) |

## Key API Endpoints

```
POST /auth/register | /auth/login | /auth/logout | /auth/forgot-password

GET  /integrations/notion/connect
GET  /integrations/notion/callback
GET  /integrations/notion/databases
POST /integrations/notion/disconnect

GET    /charts
POST   /charts
GET    /charts/:id
PUT    /charts/:id
DELETE /charts/:id
POST   /charts/:id/publish
GET    /charts/:id/preview

GET /embed/:token     ← iframe-optimized render endpoint (no auth required)
```

## Data Models

**User**: `id, name, email, password_hash, role (ADMIN|USER), status, created_at`

**Chart**: `id, user_id, name, type, config_json, embed_token, published`

## Chart Types & Config

Supported types: `bar`, `line`, `pie`, `donut`, `table`, `KPI`

Each chart config (`config_json`) stores: title, x-axis, y-axis, series, filters, aggregations, colors, legend.

## Notion Integration

OAuth 2.0 flow. Notion property types supported: `text`, `number`, `select`, `multi-select`, `date`, `checkbox`.

## Environment Variables

```
DATABASE_URL=postgres://user:password@postgres:5432/charts
JWT_SECRET=secret
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=
APP_BASE_URL=http://localhost:3000
EMBED_BASE_URL=http://localhost:4000
```

## Frontend Design Skill

A `frontend-design` skill is available at [.claude/sklills/frontend-design/SKILL.md](.claude/sklills/frontend-design/SKILL.md). Use it when building UI components or pages — it enforces production-grade, visually distinctive design (avoid generic fonts like Inter/Roboto, avoid purple gradients on white, avoid cookie-cutter layouts).

## Development Roadmap

- **Phase 1**: Auth, Notion OAuth connection, database reading
- **Phase 2**: Chart engine, preview, embed endpoint
- **Phase 3**: Gallery, duplication, filters
