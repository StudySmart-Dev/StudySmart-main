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
   - Add your key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Run all services:
   ```bash
   npm run dev:all
   ```

### Local URLs
- Frontend: `http://localhost:5173`
- JSON Server: `http://localhost:3001`
- Node/AI Server: `http://localhost:3002`

## Deployment Notes (Vercel + Render)
- Frontend: deploy to **Vercel**
- API services:
  - JSON Server + Node AI server can be deployed on **Render**
  - Set `OPENAI_API_KEY` in Render environment variables

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
- Vercel: deploy the React app (frontend).
- Render: deploy JSON Server using `db.json` so the app can fetch mock data.

## Seed credentials (from `db.json`)
- Email: `johndoe@gmail.com`
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