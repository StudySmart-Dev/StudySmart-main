import React from 'react';

import TopNav from '../ui/TopNav.jsx';

import '../styles/marketing.css';

export default function Features() {
  return (
    <div className="ls-marketingPage">
      <TopNav />

      <main className="ls-marketingMain">
        <div className="ls-pagePill">Features</div>
        <h1 className="ls-pageTitle">Everything you need to study smarter</h1>
        <p className="ls-pageSubtitle">
          A unified academic platform for notes, study groups, and partner discovery.
        </p>

        <div className="ls-cardGrid" aria-label="Feature cards">
          <div className="ls-card">
            <div className="ls-cardTitle">Note Exchange Hub</div>
            <p className="ls-cardText">
              Upload, search, and preview resources with community upvotes.
            </p>
          </div>

          <div className="ls-card">
            <div className="ls-cardTitle">Study Matcher</div>
            <p className="ls-cardText">
              Find partners based on learning preferences and availability.
            </p>
          </div>

          <div className="ls-card">
            <div className="ls-cardTitle">Live Study Rooms</div>
            <p className="ls-cardText">
              Chat, whiteboard, and a synced Pomodoro timer for better focus.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

