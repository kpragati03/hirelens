# HireLens — AI-Powered Technical Hiring Platform (MERN)

HireLens is a full-stack MERN app where recruiters post jobs, candidates apply,
an AI matcher scores each resume against the job, candidates take timed coding
assessments, and recruiters move candidates through a 6-stage hiring pipeline
and schedule interviews — with a live analytics dashboard.

**Stack:** MongoDB + Express + React (Vite) + Node.js.
AI matching uses Google Gemini when `GEMINI_API_KEY` is set, and otherwise
falls back to a transparent deterministic skill-overlap scorer, so the app
works end to end without a key. Code runs in a sandboxed in-browser runner
(or Piston, if `VITE_PISTON_API_URL` is set).

> **Deployment model — read this first:** Vercel hosts the **frontend only**
> (a static Vite SPA). It cannot run a persistent Express + MongoDB server.
> The backend is deployed separately to **Render** (free tier) and the
> frontend talks to it over HTTPS via `VITE_API_URL`. MongoDB lives on
> **MongoDB Atlas** (free tier).

---

## Project structure

```
hirelens-mern/
├── README.md
├── render.yaml                  # Render Blueprint — backend web service
├── .gitignore
├── frontend/                    # Vite + React SPA (deployed to Vercel)
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json              # SPA rewrites for Vercel
│   ├── .env.example
│   └── src/
│       ├── main.jsx  App.jsx  index.css  api.js
│       ├── data/challenges.js   # 6 coding challenges + sandboxed runner
│       └── pages/               # Dashboard, Jobs, MatchLab, Pipeline,
│                                # Assessments, Interviews
└── backend/                     # Node + Express + Mongoose API (Render)
    ├── package.json
    ├── server.js                # Express app, CORS, GET /api/health
    ├── Dockerfile               # Alternative container deploy
    ├── .dockerignore
    ├── .env.example
    ├── config/db.js
    ├── models/                  # Job, Profile, Application, Submission, Interview
    ├── routes/                  # jobs, profile, match, applications, assessments, interviews
    ├── utils/ai.js              # Gemini + deterministic AI matching / code review
    └── seed.js                  # Seeds Pragati's profile, 5 jobs, 5 applications
```

## API routes

| Method | Route | What it does |
| --- | --- | --- |
| GET | `/api/health` | Health check — `{ ok: true }`. Used by Render. |
| GET / POST | `/api/jobs` | List (with `?search=` / `?skill=`) / post a job |
| DELETE | `/api/jobs/:id` | Delete a job |
| GET / POST | `/api/profile` | Get / save the candidate profile |
| POST | `/api/match` | AI resume↔job match (score, matched/missing skills, strengths, verdict). Does not save. |
| GET / POST | `/api/applications` | List / apply (runs the AI match, stage = Applied) |
| PATCH | `/api/applications/:id/stage` | Move to Applied / Shortlisted / Assessment / Interview / Offer / Rejected |
| GET / POST | `/api/assessments` | List submissions |
| POST | `/api/assessments/submit` | Store a submission + AI code review |
| GET / POST | `/api/interviews` | List / schedule (scheduling moves the application to Interview) |
| DELETE | `/api/interviews/:id` | Cancel an interview |

## Run locally

**Prerequisites:** Node.js 18+, npm, a free MongoDB Atlas account (or a local
MongoDB). No API keys are needed to run the app.

```bash
# 1. Backend
cd backend
cp .env.example .env
# Edit .env and set MONGODB_URI (see "MongoDB Atlas setup" below).
# GEMINI_API_KEY is optional — leave it empty to use the built-in scorer.
npm install
npm run seed     # seeds Pragati's profile, 5 jobs and 5 applications
npm run dev      # or: npm start — API on http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev      # app on http://localhost:5173 (API calls proxied to :5000)
```

Open http://localhost:5173 — post a job, save a profile in Match Lab,
apply from Jobs, move the application in Pipeline, take an assessment,
schedule an interview, and watch the Dashboard update.

## MongoDB Atlas setup

1. Go to https://www.mongodb.com/cloud/atlas and create a **free (M0) cluster**.
2. **Database Access → Add Database User** — create a username/password user
   with read/write access to any database.
3. **Network Access → Add IP Address → Allow Access from Anywhere**
   (`0.0.0.0/0`). This is required for Render, whose outbound IPs change.
   (For local-only use you can allow just your own IP instead.)
4. **Clusters → Connect → Drivers** — copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hirelens?retryWrites=true&w=majority`
5. Put it in `backend/.env` as `MONGODB_URI` (locally) and in Render as an
   environment variable (below). The database name in the string is `hirelens`.

## Deploy the backend to Render (free tier)

1. Push this repo to GitHub.
2. In Render (https://dashboard.render.com) go to **New → Blueprint** and
   connect the repo. Render reads `render.yaml` at the repo root and creates
   a service called `hirelens-backend` (Node, free plan, root directory
   `backend/`, build `npm install`, start `npm start`).
   - **Alternative without a blueprint:** New → Web Service → connect the
     repo → Root Directory `backend` → Build Command `npm install` →
     Start Command `npm start` → Health Check Path `/api/health`.
3. In the service's **Environment** tab, set:
   - `MONGODB_URI` — your Atlas connection string from above.
   - `GEMINI_API_KEY` — optional; leave it unset to use the built-in scorer.
   - `JWT_SECRET` — a long random string (the blueprint generates one).
   - `FRONTEND_URL` — your live Vercel URL, e.g. `https://hirelens.vercel.app`.
     You can set this after deploying the frontend, then redeploy the backend.
     Until it is set, CORS allows all origins (development behaviour).
   - Do **not** set `PORT` — Render sets it automatically.
4. Deploy. Wait for the build, then check the health endpoint in a browser:
   `https://hirelens-backend.onrender.com/api/health` → `{ "ok": true, ... }`
   (your exact service URL is shown in the Render dashboard; it will be
   `https://<service-name>.onrender.com`).
   - **Free-tier note:** Render's free service sleeps after inactivity, so
     the first request after a pause can take ~30–60 seconds to wake up.
5. Seed the live database once, from your machine (never commit `.env`):
   ```bash
   cd backend
   # .env must contain the same MONGODB_URI as Render
   npm run seed
   ```

### Alternative: Docker

```bash
docker build -t hirelens-backend ./backend
docker run --env-file backend/.env -p 5000:5000 hirelens-backend
# Health check: curl http://localhost:5000/api/health
```

## Deploy the frontend to Vercel

1. In Vercel (https://vercel.com) go to **Add New → Project** and import the
   same GitHub repo.
2. Set **Root Directory** to `frontend` (the repo root is not the app —
   `frontend/vercel.json` and `frontend/package.json` live there).
   Vercel auto-detects Vite: Build Command `npm run build`, Output Directory `dist`.
3. In **Settings → Environment Variables**, add:
   - `VITE_API_URL` = `https://hirelens-backend.onrender.com/api`
     (your live Render backend URL **including `/api`** — use the exact URL
     from your Render dashboard, not the example above).
   - Optional: `VITE_PISTON_API_URL` = `https://emkc.org/api/v2/piston`
     to run code via Piston instead of the in-browser runner.
4. Deploy. Your app is live at e.g. `https://hirelens.vercel.app`.
5. **Close the loop:** copy that Vercel URL into Render as `FRONTEND_URL`
   (see step 3 of the backend deploy) and redeploy the backend, so CORS
   only allows your frontend. Then reload the Vercel app and confirm the
   Dashboard loads the seeded jobs and applications.

## Environment variables

| Variable | Where | Required? | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | Frontend (Vercel) | Yes in production | Base URL of the Render backend, ending in `/api` |
| `MONGODB_URI` | Backend (Render / `.env`) | Yes | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Backend (Render / `.env`) | No | Gemini AI matching / code review; deterministic fallback without it |
| `JWT_SECRET` | Backend (Render / `.env`) | Yes in production | Long random secret for future auth tokens |
| `PORT` | Backend | No (Render sets it) | Port the API listens on; 5000 locally |
| `FRONTEND_URL` | Backend (Render / `.env`) | Yes in production | Vercel frontend origin allowed by CORS |
| `VITE_PISTON_API_URL` | Frontend | No | Optional Piston code-execution API |

## Seed data

`backend/seed.js` creates Pragati Kumari's profile
(`pragati111kumari@gmail.com`, B.Tech CSE at LPU, CGPA 7.38), the 5 demo jobs
(Full-Stack Developer — Codefeast; SDE — JPMorgan Chase; Frontend — Zeta Tech;
Backend — Freshworks; Generative AI Intern — Oracle) and her 5 applications
in the Applied stage with match scores 95, 90, 90, 88 and 90. Re-running it
clears those collections first, so it is safe to re-run.

## Troubleshooting

- **Frontend shows "Could not load dashboard data"** — the backend is not
  reachable. Check `VITE_API_URL` on Vercel (must end in `/api`, no trailing
  slash issues), and that the Render service is running and
  `/api/health` returns `{ ok: true }`.
- **CORS error in the browser console** — `FRONTEND_URL` on Render does not
  exactly match the Vercel URL (including `https://`, no trailing slash).
- **Backend cannot connect to MongoDB** — check `MONGODB_URI` (username /
  password URL-encoded if they contain special characters), the database
  user exists, and Network Access allows `0.0.0.0/0`.
- **First load is slow on Render free tier** — the service was asleep; wait
  ~30–60 seconds and reload.
- **Assessments: "X is not defined"** — the function name in your code must
  match the challenge (e.g. `reverseString`). Start from the starter code.
