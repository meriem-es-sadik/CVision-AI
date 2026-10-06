# CVision AI

**AI CV Analyzer & Smart Job Matcher**

Two standalone apps that talk over HTTP — no workspace tooling, each runs in its own terminal:

- **Backend** `server/` — Node.js, Express, MongoDB Atlas, JWT, bcrypt, Multer, OpenRouter
- **Frontend** `client/` — React, Vite, JSX, Tailwind CSS, shadcn/ui, Magic UI, Lucide, Axios, Recharts

> Status: **Stage 2 complete** — project scaffold plus backend foundation and authentication
> (MongoDB connection, `User` model, JWT, validation, `register` / `login` / `logout` / `me`).
> CV parsing, AI analysis, job matching and dashboard logic are **not implemented yet.**

## Requirements

- Node.js >= 20.19
- A MongoDB Atlas cluster
- An OpenRouter API key from <https://openrouter.ai/keys> (the default model is the free `openrouter/free` router)

## Setup

```bash
# install each app's dependencies separately
cd server && npm install
cd client && npm install

# copy env files and fill in your own credentials
copy server\.env.example server\.env
copy client\.env.example client\.env
```

## Running locally (two terminals)

```bash
# terminal 1 - API on http://localhost:5000
cd server
npm run dev

# terminal 2 - frontend on http://localhost:5173
cd client
npm run dev
```

| Command                | Where    | Description                          |
| ---------------------- | -------- | ------------------------------------ |
| `npm run dev`          | `server/`| API with nodemon reload              |
| `npm run start`        | `server/`| API in production mode               |
| `npm test`             | `server/`| Server smoke tests                   |
| `npm run dev`          | `client/`| Vite dev server                      |
| `npm run build`        | `client/`| Production build of the frontend     |
| `npm run lint`         | `client/`| ESLint                               |

`client/.env` points `VITE_API_URL` at `http://localhost:5000/api` (direct calls, CORS via
`CLIENT_URL`). If you leave `VITE_API_URL` unset instead, requests go to the relative `/api`
prefix and the Vite dev server proxies them to `http://localhost:5000` (see `vite.config.js`).

## Deployment (separate hosts)

- **Client → Vercel**: import the repo and set *Root Directory* to `client`.
  Build command `npm run build`, output `dist` (auto-detected). `client/vercel.json` adds the
  SPA fallback so refreshing a client-side route (`/login`, ...) does not 404.
  Set `VITE_API_URL` in `client/.env.production` to your deployed server URL + `/api` before building.
- **Server → Render / Railway / Fly.io / VPS**: run `npm start` (or `node server.js`) with the
  environment variables `NODE_ENV=production`, `PORT`, `MONGODB_URI` (Atlas), `JWT_SECRET`,
  `CLIENT_URL` (the deployed client origin, for CORS) and `OPENROUTER_API_KEY`.
  A localhost `MONGODB_URI` is rejected at startup in production.

## Structure

```
CVision-AI/
├── .gitignore
│
├── server/
│   ├── server.js             # Express app entry point
│   ├── .env.example
│   ├── config/               # env, db, openrouter clients
│   ├── controllers/          # auth, resume, job
│   ├── middleware/           # auth, error, multer, cors, rate limiting
│   ├── models/               # User, Resume
│   ├── routes/               # auth, resume, job
│   ├── services/             # ai, resumeParser, jobMatcher
│   ├── utils/                # ApiError, ApiResponse, asyncHandler, logger, jwt, prompts
│   └── uploads/              # Multer destination (git-ignored except .gitkeep)
│
└── client/
    ├── index.html
    ├── vite.config.js        # React + Tailwind v4 plugin, @ alias, /api proxy
    ├── vercel.json           # SPA fallback when deployed alone
    ├── components.json       # shadcn/ui config
    ├── eslint.config.js
    ├── jsconfig.json
    ├── public/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css         # Tailwind v4 @theme + shadcn slate tokens (light/dark)
        ├── assets/
        ├── components/
        │   ├── ui/           # shadcn/ui  (add via: npx shadcn@latest add <component>)
        │   ├── magicui/      # Magic UI   (copy components from magicui.design)
        │   ├── layout/
        │   └── common/
        ├── constants/
        ├── context/          # AuthContext
        ├── hooks/            # useAuth
        ├── lib/              # utils (cn)
        ├── pages/            # Landing, Login, Register, Dashboard,
        │                     # UploadResume, ResumeAnalysis, JobMatcher, History
        ├── routes/           # ProtectedRoute, PublicRoute
        └── services/         # axios instance
```

## API surface

| Method | Endpoint                | Access |
| ------ | ----------------------- | ------ |
| GET    | `/api/health`           | public |
| POST   | `/api/auth/register`    | public |
| POST   | `/api/auth/login`       | public |
| POST   | `/api/auth/logout`      | public |
| GET    | `/api/auth/me`          | private |
| POST   | `/api/resumes/upload`   | private |
| GET    | `/api/resumes`          | private |
| GET    | `/api/resumes/history`  | private |
| GET    | `/api/resumes/:id`      | private |
| DELETE | `/api/resumes/:id`      | private |
| POST   | `/api/resumes/:id/analyze` | private |
| POST   | `/api/jobs/match`       | private |
| GET    | `/api/jobs/matched`     | private |

> The auth endpoints are implemented. The resume and job endpoints are still scaffolds.

Responses use `{ success, message, data }`; errors use `{ success: false, message }` with the
matching HTTP status. `POST /api/resumes/upload` expects a `multipart/form-data` field named `resume`.

### Authentication

`register` and `login` return `{ token, user }`. The `user` object never contains the password
hash. Passwords are hashed with bcryptjs (12 rounds by default) and `select: false` keeps the
hash out of query results unless explicitly requested.

Send the token on private routes as a Bearer header:

```
Authorization: Bearer <token>
```

| Code                 | Status | Meaning                                    |
| -------------------- | ------ | ------------------------------------------ |
| `VALIDATION_ERROR`   | 400    | Input failed validation; see `message`     |
| `TOKEN_MISSING`      | 401    | No `Authorization` header sent             |
| `TOKEN_MALFORMED`    | 401    | Header was not `Bearer <token>`            |
| `TOKEN_INVALID`      | 401    | Token signature or payload is invalid      |
| `TOKEN_EXPIRED`      | 401    | Token past `JWT_EXPIRES_IN`                |
| `USER_NOT_FOUND`     | 401    | Token valid, account no longer exists      |
| `INVALID_CREDENTIALS`| 401    | Wrong email or password (deliberately vague) |
| `EMAIL_ALREADY_EXISTS` | 409  | Email is taken                             |
| `JWT_SECRET_MISSING` | 500    | `JWT_SECRET` not set in `server/.env`      |

### Required environment

`MONGODB_URI` and `JWT_SECRET` must be set in `server/.env` for the auth endpoints to work.
Without them the API still boots in development and `/api/health` reports
`database: "disconnected"`, but auth requests will fail.

