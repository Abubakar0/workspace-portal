# Trend Wave Workspace Portal

Full-stack Angular employee workspace portal for an e-commerce operations company. It includes an Express API, JWT authentication, admin management screens, PostgreSQL persistence through Prisma, audit logs, VPS launch records, and Railway deployment config.

## What Is Included

- Angular workspace portal with login, dashboard, VPS access, teams, settings, and admin console
- Admin CRUD for employees, teams, and VPS records
- Role-protected admin frontend route and backend APIs
- Express backend served from the same Railway service as Angular
- PostgreSQL database schema and migration through Prisma
- Seed script for default admin, employees, teams, VPS records, and audit log
- Guacamole launch URL support using `GUACAMOLE_BASE_URL`
- Railway-ready `railway.json`

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example` and set a PostgreSQL `DATABASE_URL`.

Run database migration and seed:

```bash
npm run db:deploy
npm run db:seed
```

Run Angular and the API together:

```bash
npm run dev
```

Frontend: `http://127.0.0.1:4200`

Backend API: `http://127.0.0.1:3000/api`

Demo admin login:

```txt
admin@trendwave.com
password123
```

## Production Build

```bash
npm run build:all
```

Production start:

```bash
npm start
```

`npm start` runs Prisma migrations, seeds default data idempotently, and starts the compiled Express server.

## Railway Setup

1. Push this repo to GitHub.
2. Create a Railway project from the GitHub repo.
3. Add a Railway PostgreSQL database service.
4. In the app service, add/link these environment variables:

```txt
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=use-a-long-random-secret
GUACAMOLE_BASE_URL=https://guacamole-railway-production-4b08.up.railway.app/guacamole
CLIENT_ORIGIN=https://your-app-domain.up.railway.app
```

Railway provides `PORT` automatically.

Railway build command:

```bash
npm run build:all
```

Railway start command:

```bash
npm run start:prod
```

These are already configured in `railway.json`.

## GitHub Push

```bash
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## API Routes

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/vps`
- `POST /api/vps/:id/launch`
- `GET /api/teams`
- `GET /api/settings`
- `GET /api/admin/employees`
- `POST /api/admin/employees`
- `PUT /api/admin/employees/:id`
- `DELETE /api/admin/employees/:id`
- `POST /api/admin/teams`
- `PUT /api/admin/teams/:id`
- `DELETE /api/admin/teams/:id`
- `POST /api/admin/vps`
- `PUT /api/admin/vps/:id`
- `DELETE /api/admin/vps/:id`
- `GET /api/admin/audit-logs`
- `GET /api/health`

## Guacamole

The VPS launch endpoint returns URLs like:

```txt
https://guacamole-railway-production-4b08.up.railway.app/guacamole/#/client/CONNECTION_ID
```

Set each VPS `connectionId` in the admin panel to match the connection IDs configured in your Guacamole instance.
