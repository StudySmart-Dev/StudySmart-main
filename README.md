# StudySmart

**StudySmart** is an integrated academic platform that combines a **Study Group Management System** with a **Crowdsourced Note-Exchange Hub** to help students move from solitary studying to collaborative success.

## MVP Features (currently implemented)
- Note Exchange Hub
  - Search by `institution`, `courseCode`, `topic`
  - Preview + **Download note** (`.txt`)
  - Upvote/Downvote with **XP + achievements**
- Study Suite
  - Study group discovery (frontend-based scoring with personalization signals)
  - Live study rooms: synced **chat**, shared **whiteboard**, and **Pomodoro**
- Smart Tools & Accessibility
  - **Focus Mode** (minimizes chat during active study)
  - **Low-Bandwidth Mode** (text-optimized views)
  - AI MVP inside note preview: **summary + practice quiz**
- Achievements & Ranking
  - Education-themed rank tiers (12 tiers from novice to legendary)
  - **Strict monitor** badge at 10 downvotes
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

**StudySmart** is an integrated academic platform designed to bridge the gap between solitary leStudySmartarning and collaborative success. By merging a sophisticated **Study Group Management System** with a **Crowdsourced Note-Exchange Hub**, the platform creates a self-sustaining knowledge ecosystem for students.

## Core Features

### 1. The Note-Exchange Hub ("Reddit" for Academics)
* **Upvote/Downvote System:** High-quality, peer-vetted notes rise to the top.
* **Categorized Repository:** Search by Institution, Course Code, and Topic.
* **Preview Mode:** Verify document relevance before committing to a download.
* **Scholar Credits:** Earn badges and visibility by contributing top-tier resources.

### 2. Collaborative Study Suite
* **Study Matcher:** Find partners based on learning style (Visual, Verbal, etc.) and availability.
* **Live Study Rooms:** Integrated chat, shared whiteboard, and a synced Pomodoro timer.
* **Micro-Sessions:** Quick 15-minute "Drop-in" rooms for rapid doubt clearing.

### 3. Smart Accessibility
* **Focus Mode:** A UI toggle to minimize distractions during deep work.
* **Low-Bandwidth Mode:** Text-optimized views for students with limited data.

## Tech Stack
* **Frontend:** React.js, HTML5, CSS3, JavaScript (ES6+)
* **Styling:** Tailwind CSS / Custom CSS
* **State Management:** React Hooks (useState, useEffect, useContext)
* **Backend Simulation:** Node.js with JSON Server
* **Data Handling:** Mock API for rapid prototyping and testing

## Local Setup
To run this project locally:

1. **Clone the repo:**
   ```bash
   git clone [https://github.com/StudySmart-Dev/StudySmart-main](https://github.com/StudySmart-Dev/StudySmart-main.git)