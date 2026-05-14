# AI Debate Arena

Production-style foundation for an AI SaaS: **React + Vite** frontend, **Express + MongoDB** backend, **JWT** authentication with **bcrypt** password hashing, **Context API** for auth and theme, **Module 2 sequential AI debates** (OpenRouter + resilient fallbacks), and a **premium glassmorphism** UI (Tailwind CSS + Framer Motion).

## Folder structure

```text
├── frontend/          # Vite + React (TypeScript)
│   ├── src/
│   │   ├── components/   # Reusable UI + `components/debate/*`
│   │   ├── pages/          # Home, auth, dashboard, debate create/live/results
│   │   ├── constants/      # `aiModels.ts` (aligned with backend allowlist)
│   │   ├── context/        # Auth + theme providers
│   │   ├── services/       # Axios + auth + debate APIs
│   │   ├── routes/         # ProtectedRoute guard
│   │   ├── layouts/        # MainLayout (app shell), AuthLayout (split hero + form)
│   │   ├── hooks/          # Shared hooks (e.g. reduced motion)
│   │   ├── utils/          # className + error helpers + sleep
│   │   └── types/          # Shared TS types (user, debate)
│   └── public/
├── backend/           # Express API (ESM)
│   ├── config/        # Mongo connection + OpenRouter model allowlist
│   ├── controllers/   # HTTP handlers (auth, debates)
│   ├── models/        # Mongoose schemas (User, Debate)
│   ├── routes/        # Route mounting
│   ├── middleware/    # auth JWT + global error handler
│   ├── services/      # Auth + OpenRouter + debate engine orchestration
│   └── utils/         # asyncHandler + deterministic fallback transcript helper
└── README.md
```

## Run the frontend

```bash
cd frontend
cp .env.example .env   # optional; leave VITE_API_URL empty to use Vite proxy
npm install
npm run dev
```

Open **http://localhost:5173**. In development, `/api` is proxied to **http://localhost:5000** (see `frontend/vite.config.ts`).

**Production build:** `npm run build` then `npm run preview` to test the static output.

## Run the backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, FRONTEND_URL
npm install
npm run dev
```

API listens on **http://localhost:5000** by default. Health check: `GET /health`.

## MongoDB (Atlas) setup

1. Create a free cluster in [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user (username/password).
3. Network Access → allow your IP (or `0.0.0.0/0` for quick local dev only).
4. Database → Connect → Drivers → copy the connection string.
5. Put it in `backend/.env` as `MONGODB_URI`, replacing `<password>` and ensuring a database name in the path (e.g. `...mongodb.net/ai-debate-arena?...`).

## Environment variables

### Backend (`backend/.env`)

| Variable        | Description                                      |
|----------------|--------------------------------------------------|
| `MONGODB_URI`  | Atlas connection string                         |
| `JWT_SECRET`   | Secret for signing JWTs (use a long random value) |
| `JWT_EXPIRES_IN` | Optional, default `7d`                        |
| `PORT`         | API port (default `5000`)                        |
| `NODE_ENV`     | `development` or `production`                    |
| `FRONTEND_URL` | CORS origin, e.g. `http://localhost:5173`      |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/) key for live completions (optional — missing key uses demo fallback text) |
| `OPENROUTER_HTTP_REFERER` | Optional referer header for OpenRouter dashboards that require it |

### Frontend (`frontend/.env`)

| Variable         | Description                                                |
|------------------|------------------------------------------------------------|
| `VITE_API_URL`   | Base URL for API. **Empty** in dev uses same-origin `/api` + Vite proxy. In production set to your API origin (e.g. `https://api.example.com`). |

## Authentication flow

1. **Register** — `POST /api/auth/register` creates a user (bcrypt-hashed password), returns `{ token, user }`.
2. **Login** — `POST /api/auth/login` validates credentials, returns `{ token, user }`.
3. **Guest** — `POST /api/auth/guest` creates a lightweight guest user (`@arena.local` email), returns `{ token, user }`.
4. **Client storage** — The SPA stores `ada_token` and `ada_user` in `localStorage` and attaches `Authorization: Bearer <token>` on each request (Axios interceptor in `frontend/src/services/api.ts`).
5. **Bootstrap** — On load, if a token exists, `GET /api/auth/me` validates it and refreshes the user object.
6. **Protected UI** — `ProtectedRoute` wraps `/dashboard`, `/debate/*`; unauthenticated users are redirected to `/login` with `state.from` preserved.
7. **Logout** — Clears token and cached user, removes the default header source (localStorage).

JWT payload: `{ userId }`. Middleware `protect` verifies the token and attaches `req.user`.

## Module 2 — AI debate engine

- **Create** — `POST /api/debates/create` (auth) stores topic, Side A/B OpenRouter model ids, and `totalRounds` (`3` \| `5` \| `7`).
- **Live step** — `POST /api/debates/:id/start` generates **exactly one** next turn (Side A then Side B each round), persists it, and returns `{ debate, completed }`. The React client calls this endpoint **once per turn** with typing UI and a **2s pause** between turns — responses are never prefetched in parallel.
- **Read** — `GET /api/debates/:id` returns the transcript, `processing` lock, and `status`.
- **OpenRouter** — `backend/services/openRouterService.js` posts to `https://openrouter.ai/api/v1/chat/completions`. Failures are absorbed by `debateEngineService`, which substitutes deterministic copy from `backend/utils/fallbackDebate.js` so the debate always advances.
- **UI** — `/debate/create` (setup), `/debate/:id` (live arena; auto-starts after create via `location.state.autoStart`), `/debate/:id/results` (recap).

## Scripts reference

| Location   | Command        | Purpose              |
|-----------|----------------|----------------------|
| `frontend/` | `npm run dev`  | Vite dev server      |
| `frontend/` | `npm run build`| Typecheck + production bundle |
| `backend/`  | `npm run dev`  | Express with `--watch` |
| `backend/`  | `npm start`    | Production-style run |

## Scope

Authentication, premium shell UI, and the **Module 2 sequential debate engine** (OpenRouter + Mongo + resilient fallbacks). Further product layers (judging, billing, teams) are out of scope unless requested.

## License

Private / your choice — add a `LICENSE` when you publish.
