# ClientFlow

**Manage clients. Move work forward.**

ClientFlow is a minimal, fast workspace for freelancers and small teams:
**Clients → Projects → Tasks**, with notes, activity, dashboard and global search —
behind secure authentication, with every user fully isolated.

Versión actual: **v0.1 MVP**.

---

## ES — Español

### Descripción
ClientFlow centraliza clientes, proyectos, tareas, notas y actividad en un único lugar,
con una interfaz dark, premium y minimalista. La landing (`/`) vende el producto y la
aplicación (`/app`) es la herramienta real: todo conectado a PostgreSQL mediante una REST API.

### Funcionalidades (v0.1)
- Registro, login, logout con JWT en cookie HTTP-only + bcrypt
- Dashboard con estadísticas reales, próximas tareas, actividad y clientes recientes
- CRUD de clientes (estados ACTIVE / LEAD / INACTIVE) + vista detalle 360°
- CRUD de proyectos (PLANNING / ACTIVE / ON_HOLD / COMPLETED, prioridades, fechas)
- Tareas (TODO / IN_PROGRESS / DONE) con vista lista + kanban
- Notas asociadas a clientes/proyectos
- Actividad automática, búsqueda global (⌘K / Ctrl K), ajustes de perfil y contraseña
- Aislamiento total por usuario, validación Zod en backend + frontend, toasts y empty states

### Requisitos
- Node.js 20+ · npm 9+
- PostgreSQL 15/16 (local o vía Docker)

### Instalación
```bash
# 1. Clonar y configurar entorno
cp .env.example .env
# Edita DATABASE_URL y JWT_SECRET (mín. 32 caracteres)

# 2. Base de datos con Docker (recomendado)
docker compose up -d db

# 3. Instalar dependencias
npm --prefix backend install
npm --prefix frontend install

# 4. Migraciones + seed demo
npm --prefix backend run db:migrate
npm --prefix backend run db:seed

# 5. Arrancar (dos terminales)
npm --prefix backend run dev      # API → http://localhost:4000
npm --prefix frontend run dev     # Web → http://localhost:5173
```

Cuenta demo (tras el seed): **demo@clientflow.io / Demo1234!**

### Variables de entorno
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL |
| `JWT_SECRET` | Secreto JWT (≥32 chars, nunca en Git) |
| `JWT_EXPIRES_IN` | Duración del token (def. `7d`) |
| `PORT` | Puerto API (def. `4000`) |
| `CORS_ORIGIN` | Origen permitido (def. `http://localhost:5173`) |
| `COOKIE_SECURE` | `true` en producción HTTPS |

### API (resumen)
```
POST /api/auth/register · POST /api/auth/login · POST /api/auth/logout · GET /api/auth/me
GET|POST /api/clients · GET|PATCH|DELETE /api/clients/:id
GET|POST /api/projects · GET|PATCH|DELETE /api/projects/:id
GET|POST /api/tasks · PATCH|DELETE /api/tasks/:id
GET|POST /api/notes · PATCH|DELETE /api/notes/:id
GET /api/activities · GET /api/dashboard · GET /api/search?q=
PATCH /api/user/profile · PATCH /api/user/password
```
Errores consistentes: `{ success: false, message }`.

### Tests
```bash
npm --prefix backend test   # vitest — esquemas de validación
```

### Roadmap
- **v0.2:** búsqueda avanzada, analíticas, notificaciones
- **v0.3:** automatización, integraciones, colaboración en equipo
- **v1.0:** release estable de producción

---

## EN — English

### Overview
ClientFlow centralizes clients, projects, tasks, notes and activity in one calm,
fast, dark, premium UI. The landing (`/`) sells the product; the app (`/app`) is the
real tool — everything persisted in PostgreSQL through a REST API.

### Features (v0.1)
- Register/login/logout with JWT in HTTP-only cookie + bcrypt
- Real-data dashboard: stats, upcoming tasks, activity, recent clients
- Client CRUD (ACTIVE / LEAD / INACTIVE) + 360° detail view
- Project CRUD (PLANNING / ACTIVE / ON_HOLD / COMPLETED, priorities, dates)
- Tasks (TODO / IN_PROGRESS / DONE) with list + kanban views
- Notes attached to clients/projects
- Automatic activity log, global search (⌘K / Ctrl K), profile & password settings
- Full per-user isolation, Zod validation backend + frontend, toasts, empty states

### Requirements
- Node.js 20+ · npm 9+
- PostgreSQL 15/16 (local or via Docker)

### Setup
```bash
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET (min. 32 chars)

docker compose up -d db

npm --prefix backend install
npm --prefix frontend install

npm --prefix backend run db:migrate
npm --prefix backend run db:seed

npm --prefix backend run dev      # API → http://localhost:4000
npm --prefix frontend run dev     # Web → http://localhost:5173
```

Demo account (after seed): **demo@clientflow.io / Demo1234!**

### Project structure
```
clientflow/
├── frontend/src/{components,pages,layouts,hooks,services,types,utils}
├── backend/src/{config,lib,middleware,routes,schemas,utils}
├── backend/tests/          # vitest
├── prisma/{schema.prisma,seed.ts}
├── docker-compose.yml      # Postgres (+ optional app profile)
├── .env.example · README.md
```

### Security
bcrypt hashing · HTTP-only SameSite cookies · helmet · CORS with credentials ·
Zod on every input · Prisma (no raw SQL) · per-user scoping on all queries ·
rate limiting on auth · no secrets in Git.

### License
MIT — see LICENSE (to be added before public release).
