import React from 'react';
import { Link } from 'react-router-dom';

import TopNav from '../ui/TopNav.jsx';

import '../styles/marketing.css';

export default function Pricing() {
  return (
    <div className="ls-marketingPage">
      <TopNav />

      <main className="ls-marketingMain">
        <div className="ls-pagePill">Pricing</div>
        <h1 className="ls-pageTitle">Simple plans for serious learners</h1>
        <p className="ls-pageSubtitle">
          Start free and upgrade when you want more study-room access and advanced filters.
        </p>

        <div className="ls-pricingGrid" aria-label="Pricing plans">
          <div className="ls-plan">
            <div className="ls-planTop">
              <p className="ls-planName">Starter</p>
              <p className="ls-planPrice">$0</p>
            </div>
            <p className="ls-planText">For exploring StudySmart and building your library.</p>
            <ul className="ls-planList">
              <li>Note preview & search</li>
              <li>Basic group discovery</li>
              <li>Weekly discussions</li>
            </ul>
            <Link className="ls-planCta" to="/create-account">
              Get started
            </Link>
          </div>

          <div className="ls-plan isFeatured">
            <div className="ls-planTop">
              <p className="ls-planName">Plus</p>
              <p className="ls-planPrice">$8</p>
            </div>
            <p className="ls-planText">For consistent collaboration and study-room tools.</p>
            <ul className="ls-planList">
              <li>Priority study matching</li>
              <li>More study-room sessions</li>
              <li>Focus mode + low-bandwidth</li>
            </ul>
            <Link className="ls-planCta" to="/create-account">
              Choose Plus
            </Link>
          </div>

          <div className="ls-plan">
            <div className="ls-planTop">
              <p className="ls-planName">Pro</p>
              <p className="ls-planPrice">$16</p>
            </div>
            <p className="ls-planText">For power users who want deeper insights and credits.</p>
            <ul className="ls-planList">
              <li>Advanced filters</li>
              <li>Scholar credits boosters</li>
              <li>Extended collaboration tools</li>
            </ul>
            <Link className="ls-planCta" to="/create-account">
              Go Pro
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

