import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import TopNav from '../ui/TopNav.jsx';

import '../styles/marketing.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  function setField(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <div className="ls-marketingPage">
      <TopNav />

      <main className="ls-marketingMain">
        <div className="ls-pagePill">Contact</div>
        <h1 className="ls-pageTitle">Let’s build your study plan</h1>
        <p className="ls-pageSubtitle">
          Ask questions, suggest improvements, or report issues. We’ll get back to you.
        </p>

        <div className="ls-contactGrid" aria-label="Contact form and details">
          <section className="ls-contactBox" aria-label="Contact form">
            <label>
              <span className="ls-fieldLabel">Name</span>
              <input
                className="ls-input"
                value={form.name}
                onChange={setField('name')}
                placeholder="Your name"
              />
            </label>

            <div style={{ height: 12 }} />

            <label>
              <span className="ls-fieldLabel">Email</span>
              <input
                className="ls-input"
                value={form.email}
                onChange={setField('email')}
                placeholder="you@example.com"
              />
            </label>

            <div style={{ height: 12 }} />

            <label>
              <span className="ls-fieldLabel">Message</span>
              <textarea
                className="ls-textarea"
                value={form.message}
                onChange={setField('message')}
                placeholder="Write your message..."
              />
            </label>

            <button
              className="ls-primaryBtn"
              type="button"
              onClick={() => {
                // Mock submit (no backend yet)
                setForm({ name: '', email: '', message: '' });
              }}
            >
              Send message
            </button>
          </section>

          <aside className="ls-contactBox" aria-label="Contact details">
            <div className="ls-cardTitle">Quick links</div>
            <p className="ls-cardText">Explore how StudySmart works, then create your account to start collaborating.</p>
            <div style={{ height: 14 }} />
            <div className="ls-cardText">
              Email: <strong>support@studysmart.app</strong>
              <br />
              Response time: <strong>within 24 hours</strong>
            </div>
          </aside>
        </div>

        <div style={{ marginTop: 22, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link className="ls-ctaBtn" to="/create-account" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            Create your account
          </Link>
          <Link
            to="/dashboard"
            style={{
              border: '1px solid rgba(17, 17, 26, 0.12)',
              background: 'rgba(255,255,255,0.9)',
              color: '#0b0b0f',
              padding: '12px 18px',
              borderRadius: 12,
              fontWeight: 900,
              textDecoration: 'none'
            }}
          >
            Open dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

