# ClientFlow

**Manage clients. Move work forward.**

ClientFlow is a minimal, fast workspace for freelancers and small teams:
**Client → Project → Task → Collaboration → Delivery**, with notes, activity,
a client portal, requests, automations and notifications —
behind secure authentication, with every user fully isolated.

Versión actual: **v0.2 (portal + colaboración)**.

---

## ES — Español

### Descripción
ClientFlow centraliza clientes, proyectos, tareas, notas y actividad en un único lugar,
con una interfaz dark, premium y minimalista. La landing (`/`) vende y demuestra el producto
(demo interactiva incluida) y la aplicación (`/app`) es la herramienta real: todo persistido
en SQLite en desarrollo (objetivo de producción: PostgreSQL) mediante una REST API.
Cada cliente puede además recibir un **portal privado** con enlace mágico para ver
progreso compartido, crear solicitudes y conversar.

### Funcionalidades (v0.2 — implementado y verificado)
- Registro, login, logout con JWT en cookie HTTP-only + bcrypt
- Dashboard real: salud de proyectos, vencidas, deadlines, solicitudes, próximas acciones (heurística con datos reales), actividad
- CRUD de clientes + vista 360° con panel de portal y solicitudes
- CRUD de proyectos con salud calculada (HEALTHY/AT_RISK/BLOCKED/COMPLETED), progreso real y visibilidad compartida
- Tareas (lista + kanban) con flag compartido
- Notas INTERNAL/SHARED, comentarios en proyectos/tareas/solicitudes
- **Client Portal** (`/portal/:token`): proyectos compartidos, progreso, solicitudes, comentarios — aislamiento total por token
- **Solicitudes** con flujo Request → Task (convertir en tarea)
- **Automatizaciones** WHEN → THEN (4 triggers, 3 acciones, motor extensible) + scan de vencidas
- Notificaciones internas con campana y no leídas, búsqueda global (clientes, proyectos, tareas, notas, solicitudes), command palette con comandos reales
- Capa de inteligencia lista para proveedor externo (`INTELLIGENCE_PROVIDER`, hoy heurística local sin API keys)
- **Bilingüe ES/EN** en toda la UI (landing, app, errores, empty states) con test de paridad
- Aislamiento por usuario en todas las queries, validación Zod, toasts, empty states

### Requisitos
- Node.js 20+ · npm 9+
- Nada más: la base de datos es **SQLite** (un archivo `prisma/dev.db`, cero instalación).
  El modelo es relacional y está listo para PostgreSQL (ver nota más abajo).

### Instalación
```bash
# 1. Instalar dependencias
npm --prefix backend install
npm --prefix frontend install

# 2. Base de datos (SQLite — sin Docker ni contraseñas)
npm --prefix backend run db:migrate
npm --prefix backend run db:seed

# 3. Arrancar (dos terminales)
npm --prefix backend run dev      # API → http://localhost:4000
npm --prefix frontend run dev     # Web → http://localhost:5173
```
Los `.env` ya existen con valores de desarrollo (`DATABASE_URL="file:./dev.db"`).
Cambia `JWT_SECRET` antes de cualquier uso serio.

Cuenta demo (tras el seed): **demo@clientflow.io / Demo1234!**

Portal demo (cliente Nova Studio): **http://localhost:5173/portal/demo-portal-nova-001**
(token fijo solo para demo; las invitaciones reales usan tokens aleatorios).

### Variables de entorno
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | `file:./dev.db` (SQLite). Para Postgres: `postgresql://...` |
| `JWT_SECRET` | Secreto JWT (≥32 chars, nunca en Git) |
| `JWT_EXPIRES_IN` | Duración del token (def. `7d`) |
| `PORT` | Puerto API (def. `4000`) |
| `CORS_ORIGIN` | Origen permitido (def. `http://localhost:5173`) |
| `COOKIE_SECURE` | `true` en producción HTTPS |

### Nota: migrar a PostgreSQL
El schema (`prisma/schema.prisma`) documenta la variante Postgres:
cambia `provider` a `postgresql`, restaura enums nativos y `@db.Text`,
apunta `DATABASE_URL` al servidor y ejecuta `db:migrate`. Las queries son
Prisma puro (sin SQL crudo), así que no hay que tocar el backend.
`docker-compose.yml` incluye un servicio Postgres listo para ese momento.

### API (resumen)
```
POST /api/auth/register · POST /api/auth/login · POST /api/auth/logout · GET /api/auth/me
GET|POST /api/clients · GET|PATCH|DELETE /api/clients/:id
PATCH /api/clients/:id/portal · POST /api/clients/:id/portal/regenerate
GET|POST /api/projects · GET|PATCH|DELETE /api/projects/:id · PATCH /api/projects/:id/share
GET|POST /api/tasks · PATCH|DELETE /api/tasks/:id
GET|POST /api/notes · PATCH|DELETE /api/notes/:id
GET|POST /api/requests · GET|PATCH|DELETE /api/requests/:id · POST /api/requests/:id/convert
GET|POST /api/comments · DELETE /api/comments/:id
GET /api/notifications · PATCH /api/notifications/:id/read · POST /api/notifications/read-all
GET|POST|PATCH|DELETE /api/automations (+ /meta, /run-overdue)
GET /api/intelligence/next-actions · GET /api/intelligence/projects/:id/summary
GET /api/portal/:token · POST /api/portal/:token/requests · POST /api/portal/:token/comments
GET /api/activities · GET /api/dashboard · GET /api/search?q=
PATCH /api/user/profile · PATCH /api/user/password
```
Errores consistentes: `{ success: false, message }`.
Portal: token en path (nunca en query), 404 ante token inválido/desactivado, solo contenido SHARED.

### Tests
```bash
npm --prefix backend test   # vitest: validación, salud de proyecto, colaboración, paridad i18n (18 tests)
```

### Roadmap (honesto)
- **v0.1 ✅ Core workspace** — auth, clientes, proyectos, tareas, notas, dashboard, actividad
- **v0.2 ✅ Portal + colaboración** — portal de cliente, solicitudes, comentarios, notificaciones, automatizaciones, salud, i18n ES/EN, inteligencia local
- **v0.3 ⏳ Analytics + intelligence** — informes, proveedor IA real, búsqueda avanzada
- **v0.4 ⏳ Teams + integrations** — roles, email, API pública, webhooks
- **v1.0 ⏳ Production-ready release**

---

## EN — English

### Overview
ClientFlow centralizes clients, projects, tasks, notes and activity in one calm,
fast, dark, premium UI. The landing (`/`) sells and demonstrates the product
(including an interactive demo); the app (`/app`) is the real tool — everything
persisted in SQLite for development (production target: PostgreSQL) through a REST API.
Each client can also get a **private portal** (magic link) with shared progress,
requests and discussion.

### Features (v0.2 — implemented and verified)
- Register/login/logout with JWT in HTTP-only cookie + bcrypt
- Real-data dashboard: project health, overdue, deadlines, requests, next actions (heuristic over real data), activity
- Client CRUD + 360° view with portal panel and requests
- Project CRUD with computed health (HEALTHY/AT_RISK/BLOCKED/COMPLETED), real progress, shared visibility
- Tasks (list + kanban) with shared flag
- INTERNAL/SHARED notes, comments on projects/tasks/requests
- **Client Portal** (`/portal/:token`): shared projects, progress, requests, comments — full token isolation
- **Requests** with Request → Task flow (convert to task)
- **Automations** WHEN → THEN (4 triggers, 3 actions, extensible engine) + overdue scan
- In-app notifications with bell + unread, global search (clients, projects, tasks, notes, requests), command palette with real commands
- Intelligence layer ready for an external provider (`INTELLIGENCE_PROVIDER`; local heuristic today, no API keys)
- **Fully bilingual ES/EN** (landing, app, errors, empty states) with parity test
- Per-user isolation on all queries, Zod validation, toasts, empty states

### Requirements
- Node.js 20+ · npm 9+
- Nothing else: the database is **SQLite** (a `prisma/dev.db` file, zero setup).
  The model is relational and Postgres-ready (see note below).

### Setup
```bash
npm --prefix backend install
npm --prefix frontend install

npm --prefix backend run db:migrate
npm --prefix backend run db:seed

npm --prefix backend run dev      # API → http://localhost:4000
npm --prefix frontend run dev     # Web → http://localhost:5173
```
Dev `.env` files already exist (`DATABASE_URL="file:./dev.db"`).
Rotate `JWT_SECRET` before any serious use.

Demo account (after seed): **demo@clientflow.io / Demo1234!**

Demo portal (Nova Studio client): **http://localhost:5173/portal/demo-portal-nova-001**
(fixed token for demo only; real invites use random tokens).

### Project structure
```
clientflow/
├── frontend/src/{components,pages,layouts,hooks,services,types,utils}
├── backend/src/{config,lib,middleware,routes,schemas,utils}
├── backend/tests/          # vitest
├── prisma/{schema.prisma,seed.ts,migrations/,dev.db}
├── docker-compose.yml      # optional Postgres for the future Postgres path
├── .env.example · README.md
```

### Security
bcrypt hashing · HTTP-only SameSite cookies · helmet · CORS with credentials ·
Zod on every input · Prisma (no raw SQL) · per-user scoping on all queries ·
token-scoped portal (only SHARED content, 404 oracle-free) · rate limiting on auth + portal ·
no secrets in Git.

### License
MIT — see LICENSE (to be added before public release).
