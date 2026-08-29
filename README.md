# BetMasters

A Bundesliga prediction game: users predict match results for every matchday,
earn points (3 for an exact score, 1 for the correct tendency), and compete
against each other on a leaderboard — per matchday and across the whole
season.

Match and result data comes from the public
[OpenLigaDB](https://www.openligadb.de/) API.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Tests](#tests)
- [Deployment](#deployment)

## Features

- Registration/login, change password in the profile, password reset via email
- Place bets per matchday, locked as soon as a match kicks off
- Leaderboard per matchday and for the whole season, with a deterministic
  tie-breaker (points → exact hits → name)
- Automatic point calculation via a cron job once a matchday has finished
- Reminder emails when a matchday is starting soon and a user hasn't bet yet
- Automatic season archiving ~30 days after the last matchday: the final
  standings are saved (with PDF export) and that season's bets are cleaned up
- Installable as a PWA

## Tech Stack

**Backend**: Node.js, Express 5, TypeScript, MongoDB/Mongoose, JWT auth,
node-cron, Nodemailer, pdfkit

**Frontend**: React 19, TypeScript, Vite, React Router, Context API + reducer
for global state

**Tooling**: pnpm workspace (backend + `client/` as its own package), Vitest +
Testing Library, mongodb-memory-server for real DB integration tests, Biome
(lint/format), GitHub Actions CI

The project is a monolith: a single Node process builds the client and, in
production, serves it statically from the same Express app as the API — no
separate frontend server needed.

## Project Structure

```
.
├── app.ts                  # Express app (middleware, routes)
├── server.ts               # Entry point: DB connect, cron jobs, server start
├── controllers/            # Route handlers
├── routes/                 # Express routers
├── models/                 # Mongoose schemas
├── middleware/
├── scheduler/              # node-cron jobs (scoring, reminders, archiving)
├── utils/
├── errors/
├── types/                  # global type augmentations
└── client/                 # React frontend (its own pnpm package)
    └── src/
        ├── pages/
        ├── components/
        ├── context/        # global state (Context + reducer)
        └── utils/
```

## Prerequisites

- Node.js ≥ 20
- pnpm (version pinned via `packageManager` in `package.json`, available
  automatically through [Corepack](https://nodejs.org/api/corepack.html))
- A MongoDB instance (local or e.g. MongoDB Atlas)

## Setup

```bash
git clone <repo-url>
cd Bet_App
pnpm install            # installs the backend and client/ (pnpm workspace)
cp .env.example .env    # see Environment Variables below
```

## Environment Variables

In a `.env` file at the project root:

| Variable       | Required | Description                                               |
| -------------- | -------- | --------------------------------------------------------- |
| `MONGODB_URI`  | yes      | Connection string for the MongoDB instance                |
| `JWT_SECRET`   | yes      | Secret used to sign auth tokens                           |
| `JWT_LIFETIME` | no       | Token lifetime (default: `1d`)                            |
| `PORT`         | no       | Server port in dev (default: `5050`)                      |
| `NODE_ENV`     | no       | `development` (default) or `production`                   |
| `SMTP_HOST`    | no\*     | SMTP server for outbound mail (password reset, reminders) |
| `SMTP_PORT`    | no\*     | SMTP port (e.g. `587`)                                    |
| `SMTP_USER`    | no\*     | SMTP credentials                                          |
| `SMTP_PASS`    | no\*     | SMTP credentials                                          |
| `SMTP_FROM`    | no\*     | From address for outbound mail                            |

\* Without SMTP configured, sending mail fails and gets logged, but doesn't
block any requests — forgot-password still responds generically, and reminder
emails are simply skipped for that user. A free
[Ethereal](https://ethereal.email/) test account works well for local testing.

## Development

```bash
pnpm run dev
```

Starts the backend (`tsx watch`, hot reload) and frontend (Vite dev server
with an `/api` proxy to the backend) in parallel.

### More scripts (root)

| Script                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `pnpm start`            | Start only the backend (`tsx watch`)           |
| `pnpm run client`       | Start only the frontend                        |
| `pnpm run build`        | Compile the backend to `dist/`                 |
| `pnpm run build-client` | Frontend production build                      |
| `pnpm run typecheck`    | `tsc --noEmit`                                 |
| `pnpm test`             | Backend tests (Vitest + mongodb-memory-server) |
| `pnpm run test:watch`   | Backend tests in watch mode                    |
| `pnpm run test:all`     | Backend **and** frontend tests                 |
| `pnpm run lint`         | Biome check                                    |
| `pnpm run lint:fix`     | Biome check with autofix                       |

Frontend-specific scripts (`pnpm --dir client run <script>`, or from inside
`client/`): `start`, `build`, `typecheck`, `test`.

## Tests

Backend tests run against a real, temporary MongoDB instance
(`mongodb-memory-server`) instead of mocks — external dependencies like the
OpenLigaDB API or the mailer are mocked deliberately. Frontend tests use
Vitest + React Testing Library.

```bash
pnpm test              # backend
pnpm --dir client test # frontend
pnpm run test:all      # both
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint,
typecheck, and both test suites on every push/PR to `main`.

## Deployment

Configured for [Render](https://render.com) as a single web service
([render.yaml](render.yaml)): `pnpm run setup-production` builds the client
and backend, `node dist/server.js` serves both the API and the built React
app statically in production. `MONGODB_URI` and the `SMTP_*` variables need
to be set manually in the Render dashboard (external services, not a Render
add-on).
