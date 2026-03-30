# StudySmart

StudySmart combines a **collaborative study dashboard** with a **crowdsourced note hub**.

## Tech Stack
- HTML
- CSS
- JavaScript
- React.js (Vite)
- Node.js
- JSON Server
- Mock API

## Key Features
- Note upload (typed content + file upload: PDF, DOCX, PPTX, TXT/MD/JSON)
- AI-powered summary and explain actions:
  - Explain more
  - Explain simpler
  - Give example
  - Custom explain prompt
- Note preview, download, upvote/downvote
- Study room with chat (polling sync), shared whiteboard (JSON Server), and Pomodoro (per-browser state per room)
- Focus Mode and Low-Bandwidth Mode
- XP, rank tiers, badges (including **Strict monitor**), leaderboard

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   - Copy `.env.example` to `.env`
   - Set at least `OPENAI_API_KEY`, `JSON_SERVER_URL`, `VITE_API_URL`, and `VITE_SERVER_API_URL` (defaults in `.env.example` work with `npm run dev:all` on localhost).
3. Run all services:
   ```bash
   npm run dev:all
   ```

### Local URLs
- Frontend: `http://localhost:5173`
- JSON Server: `http://localhost:3001`
- Node/AI Server: `http://localhost:3002`

## Deployment (Vercel + JSON Server host)

The Vite app and the **AI/upload API** can live on **one Vercel project**: the Express app in `api/index.js` handles `POST /api/notes/upload` and `POST /api/ai/explain` (see `vercel.json` rewrites). **JSON Server** should still run on a long-lived host (e.g. **Render**, Railway, Fly) with `db.json` and **CORS** enabled for your Vercel domain.

### Vercel — Environment Variables

Set these in the project **Settings → Environment Variables** (use the same values for *Production* and *Preview* where applicable). **Redeploy** after changes; `VITE_*` variables are applied at **build** time.

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes (for AI) | Summaries on upload + explain actions |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `JSON_SERVER_URL` | Yes on Vercel | Public URL of JSON Server (no trailing slash). Serverless upload POSTs new notes here. |
| `VITE_API_URL` | Yes | Same URL as JSON Server; baked into the SPA for all CRUD fetches. |
| `VITE_SERVER_API_URL` | Yes | Use `/api` when the AI routes are on the same Vercel deployment. |

Example:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
JSON_SERVER_URL=https://your-api.onrender.com
VITE_API_URL=https://your-api.onrender.com
VITE_SERVER_API_URL=/api
```

Smoke test after deploy: `GET https://studysmart-sandy.vercel.app/api/health` (production URL for this project).

### Troubleshooting: `localhost:3001` / `ERR_CONNECTION_REFUSED` on Vercel

The browser cannot reach **your computer’s** JSON Server. The built app must use a **public** API URL.

1. Deploy **JSON Server** (same `db.json`) to Render, Railway, etc. Example base: `https://studysmart-api.onrender.com`.
2. In **Vercel** → Project → **Settings** → **Environment Variables** (check **Production** and **Preview**):
   - `VITE_API_URL` = `https://studysmart-api.onrender.com` (exactly your JSON Server URL, **no** `/notes`, **no** trailing slash)
   - `JSON_SERVER_URL` = same value (for the `/api` serverless upload route)
   - `VITE_SERVER_API_URL` = `/api`
3. Click **Redeploy** so Vite rebuilds with `VITE_*` baked in.

Until that is set, the SPA shows a yellow configuration banner on [studysmart-sandy.vercel.app](https://studysmart-sandy.vercel.app/).

### JSON Server host (e.g. Render)

- This repo includes **`render.yaml`** (Blueprint) and **`db.json`** in Git so every deploy has **users, groups, notes, meetings, meetingMessages, whiteboards, xpEvents**. The build runs `scripts/verify-db-for-render.mjs` to fail fast if a collection is missing.
- Opening the service root **`/`** shows an HTML index with links to all JSON routes (from `render-public/`).
- Start command similar to: `npx json-server --watch db.json --port $PORT --host 0.0.0.0 --cors` or use json-server’s `--cors` if acceptable for your threat model.
- Allow the browser origin of your Vercel app so the SPA can call `VITE_API_URL` without CORS errors.

### Local vs production — where env is read

| Area | Variables |
|------|-----------|
| Browser (built app) | `VITE_API_URL`, `VITE_SERVER_API_URL` only |
| `api/index.js` (Vercel or `npm run dev:server`) | `OPENAI_*`, `JSON_SERVER_URL` |
| `npm run dev:api` (JSON Server) | (none required; use `--cors` for localhost) |

See **`.env.example`** for a single-file checklist.

# StudySmart

**StudySmart** is an integrated academic platform that combines a **Study Group Management System** with a **Crowdsourced Note-Exchange Hub** to help students move from solitary studying to collaborative success.

## MVP Features (currently implemented)
- Note Exchange Hub
  - Search by `institution`, `courseCode`, `topic`
  - Preview + **Download note** (`.txt`)
  - Upvote/Downvote with **XP + achievements**
- Study Suite
  - Study group discovery (frontend-based scoring with personalization signals)
  - Live study rooms: **chat** (shared via API polling), **whiteboard**, and **Pomodoro** (saved locally per browser)
- Smart Tools & Accessibility
  - **Focus Mode** (minimizes chat during active study)
  - **Low-Bandwidth Mode** (text-optimized views)
  - AI MVP inside note preview: **summary + practice quiz**
- Achievements & Ranking
  - Education-themed rank tiers (12 tiers from novice to legendary)
  - **Strict monitor** badge after a user casts **10 downvotes** on notes (tracked on their profile)
  - Leaderboard page (`/dashboard/leaderboard`) ranked by tier/XP

## Tech Stack
- Frontend: **React** (Vite) + **React Router**
- Styling: **Custom CSS**
- Mock Backend: **JSON Server** (Node.js)
- Data/API: Fetch-based mock API that talks to JSON Server

## Setup (local)
1. Install:
   ```bash
   npm install
   ```
2. Start frontend + JSON Server:
   ```bash
   npm run dev:all
   ```
3. Open:
   - Frontend: `http://localhost:5173`
   - API (JSON Server): `http://localhost:3001`

## API endpoints (JSON Server)
Data is in `db.json` and is exposed by JSON Server at `http://localhost:3001`:
- `/users`
- `/notes`
- `/groups`
- `/meetings`
- `/meetingMessages`
- `/whiteboards`

## Deployment (Vercel + Render)
- **Vercel:** connect the GitHub repo; build output is the Vite app plus serverless `/api/*` (see the deployment section above).
- **Render (or similar):** run JSON Server with `db.json` and set `JSON_SERVER_URL` / `VITE_API_URL` on Vercel to that public URL.

## Seed credentials (from `db.json`)
- Email: `glennosioh@gmail.com`
- Password: `password`

# StudySmart

**StudySmart** is an integrated academic platform designed to bridge the gap between solitary learning and collaborative success. By merging a sophisticated **Study Group Management System** with a **Crowdsourced Note-Exchange Hub**, the platform creates a self-sustaining knowledge ecosystem for students.

## Core Features

### 1. The Note-Exchange Hub ("Reddit" for Academics)
* **Upvote/Downvote System:** High-quality, peer-vetted notes rise to the top.
* **Categorized Repository:** Search by Institution, Course Code, and Topic.
* **Preview Mode:** Verify document relevance before committing to a download.
* **Scholar Credits:** Earn badges and visibility by contributing top-tier resources.

### 2. Collaborative Study Suite
* **Study Matcher:** Find partners based on learning style (Visual, Verbal, etc.) and availability.
* **Live Study Rooms:** Integrated chat, shared whiteboard, and a Pomodoro timer (per device; not synchronized across participants).
* **Micro-Sessions:** Quick 15-minute "Drop-in" rooms for rapid doubt clearing.

### 3. Smart Accessibility
* **Focus Mode:** A UI toggle to minimize distractions during deep work.
* **Low-Bandwidth Mode:** Text-optimized views for students with limited data.

## Tech Stack
* **Frontend:** React.js, HTML5, CSS3, JavaScript (ES6+)
* **Styling:** Custom CSS (Tailwind is not configured in this repo; see `ROADMAP.md` Phase 1)
* **State Management:** React Hooks (useState, useEffect, useContext)
* **Backend Simulation:** Node.js with JSON Server
* **Data Handling:** Mock API for rapid prototyping and testing

## Local Setup
To run this project locally:

1. **Clone the repo:**
   ```bash
   git clone [https://github.com/StudySmart-Dev/StudySmart-main](https://github.com/StudySmart-Dev/StudySmart-main.git)