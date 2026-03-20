import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext.jsx';

import '../../styles/dashboard.css';

function Toggle({ checked, label, onChange }) {
  return (
    <label className="ds-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [focusMode, setFocusMode] = useState(false);
  const [lowBandwidth, setLowBandwidth] = useState(false);

  useEffect(() => {
    try {
      const fm = localStorage.getItem('studysmart_focusMode');
      const lb = localStorage.getItem('studysmart_lowBandwidth');
      setFocusMode(fm === '1');
      setLowBandwidth(lb === '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('studysmart_focusMode', focusMode ? '1' : '0');
      localStorage.setItem('studysmart_lowBandwidth', lowBandwidth ? '1' : '0');
    } catch {
      // ignore
    }
  }, [focusMode, lowBandwidth]);

  const title = useMemo(() => {
    if (location.pathname.includes('sessions')) return 'Sessions';
    if (location.pathname.includes('groups')) return 'Groups';
    if (location.pathname.includes('collaborators')) return 'Collaborators';
    return 'Overview';
  }, [location.pathname]);

  return (
    <div className={`ds-shell ${focusMode ? 'ds-focusMode' : ''}`}>
      <div className="ds-container">
        <aside className="ds-sidebar" aria-label="Dashboard navigation sidebar">
          <div className="ds-brandBadge">
            <div className="ds-brandMark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.5 8.2C7.5 7.53726 8.03726 7 8.7 7H17.3C17.9627 7 18.5 7.53726 18.5 8.2V28.1C18.5 28.7627 17.9627 29.3 17.3 29.3H8.7C8.03726 29.3 7.5 28.7627 7.5 28.1V8.2Z"
                  stroke="#0B0B0F"
                  strokeWidth="2"
                />
                <path
                  d="M18.5 8.2C18.5 7.53726 19.0373 7 19.7 7H26.8C27.4627 7 28 7.53726 28 8.2V28.1C28 28.7627 27.4627 29.3 26.8 29.3H19.7C19.0373 29.3 18.5 28.7627 18.5 28.1V8.2Z"
                  stroke="#0B0B0F"
                  strokeWidth="2"
                />
                <path d="M18.3 13C16 11.6 13.6 11.2 10.8 12" stroke="#0B0B0F" strokeWidth="2" strokeLinecap="round" />
                <path d="M18.3 17C16 15.6 13.6 15.2 10.8 16" stroke="#0B0B0F" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="ds-brandText ds-sideLabel">StudySmart</div>
          </div>

          <nav className="ds-nav" aria-label="Dashboard sidebar links">
            <NavLink className={({ isActive }) => `ds-navItem ${isActive ? 'isActive' : ''}`} to="/dashboard">
              <span className="ds-sideDot" aria-hidden="true" />
              <span className="ds-sideLabel">Overview</span>
            </NavLink>
            <NavLink
              className={({ isActive }) => `ds-navItem ${isActive ? 'isActive' : ''}`}
              to="/dashboard/sessions"
            >
              <span className="ds-sideDot" aria-hidden="true" />
              <span className="ds-sideLabel">Sessions</span>
            </NavLink>
            <NavLink
              className={({ isActive }) => `ds-navItem ${isActive ? 'isActive' : ''}`}
              to="/dashboard/groups"
            >
              <span className="ds-sideDot" aria-hidden="true" />
              <span className="ds-sideLabel">Groups</span>
            </NavLink>
            <NavLink
              className={({ isActive }) => `ds-navItem ${isActive ? 'isActive' : ''}`}
              to="/dashboard/collaborators"
            >
              <span className="ds-sideDot" aria-hidden="true" />
              <span className="ds-sideLabel">Collaborators</span>
            </NavLink>
          </nav>

          <div className="ds-sidebarFooter">
            {user ? (
              <div className="ds-userRow">
                <div className="ds-avatar" aria-hidden="true" />
                <div style={{ minWidth: 0 }}>
                  <div className="ds-userName">{user.name}</div>
                  <div className="ds-userEmail">{user.email}</div>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="ds-contentWrap">
          <header className="ds-topbar" aria-label="Dashboard top bar">
            <h2 className="ds-topTitle">{title}</h2>

            <div className="ds-topRight">
              <Toggle
                checked={focusMode}
                label="Focus Mode"
                onChange={(e) => setFocusMode(e.target.checked)}
              />
              <Toggle
                checked={lowBandwidth}
                label="Low-Bandwidth"
                onChange={(e) => setLowBandwidth(e.target.checked)}
              />
              <button
                className="ds-logoutBtn"
                type="button"
                onClick={() => {
                  logout();
                  navigate('/signin');
                }}
              >
                Sign out
              </button>
            </div>
          </header>

          <Outlet context={{ lowBandwidth, focusMode }} />
        </div>
      </div>
    </div>
  );
}

