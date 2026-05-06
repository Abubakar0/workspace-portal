# Trend Wave Workspace Portal

Full-stack Angular workspace portal with an Express API backend, JWT authentication, protected workspace routes, seeded VPS/team data, and Railway deployment config.

## Local Development

Install dependencies:

```bash
npm install
```

Run Angular and the API together:

```bash
npm run dev
```

Frontend: `http://127.0.0.1:4200`

Backend API: `http://127.0.0.1:3000/api`

Demo login:

```txt
admin@trendwave.com
password123
```

## Production Build

Build Angular and compile the backend:

```bash
npm run build:all
```

Start the production server:

```bash
npm start
```

In production, Express serves the Angular build and the API from the same app. The frontend calls `/api`, so Railway does not need a separate frontend service.

## Environment Variables

Create local `.env` from `.env.example` when needed. On Railway, add these variables in the project settings:

```txt
JWT_SECRET=use-a-long-random-secret
GUACAMOLE_BASE_URL=https://your-guacamole-host/guac
CLIENT_ORIGIN=https://your-railway-domain.up.railway.app
```

Railway automatically provides `PORT`, so you usually do not need to set it.

## GitHub Push

```bash
git init
git add .
git commit -m "Initial full-stack workspace portal"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Railway Deploy

1. Push this repo to GitHub.
2. In Railway, create a new project.
3. Choose Deploy from GitHub repo.
4. Select this repository.
5. Add the environment variables listed above.
6. Railway will run `npm run build:all`.
7. Railway will start the app with `npm run start:prod`.

## Included API

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/vps`
- `POST /api/vps/:id/launch`
- `GET /api/teams`
- `GET /api/settings`
- `GET /api/health`

## Current Backend Scope

This repo is ready to deploy as a full-stack starter. It uses seeded in-memory data for users, teams, and VPS records. For a real production company portal, the next backend upgrade is replacing the seeded data with PostgreSQL and connecting the launch endpoint to a real Apache Guacamole session API.
