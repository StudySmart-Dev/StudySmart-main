import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TopNav from '../ui/TopNav.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

import '../styles/auth.css';

export default function Signin() {
  const navigate = useNavigate();
  const { signin } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  function setField(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <div className="ls-authPage">
      <TopNav />

      <main className="ls-authMain">
        <section className="ls-authForm" aria-label="Signin form">
          <h1 className="ls-authHeading">Welcome back</h1>
          <p className="ls-authSub">Sign in to access your dashboard</p>

          <form
            className="ls-formGrid"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              try {
                await signin(form);
                navigate('/dashboard');
              } catch (err) {
                setError(err?.message || 'Failed to sign in');
              }
            }}
          >
            <label>
              <span className="ls-fieldLabel">Email</span>
              <input
                className="ls-input"
                value={form.email}
                onChange={setField('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              <span className="ls-fieldLabel">Password</span>
              <input
                type="password"
                className="ls-input"
                value={form.password}
                onChange={setField('password')}
                placeholder="************"
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: 13 }}>{error}</div>
            ) : null}

            <button className="ls-primaryBtn" type="submit">
              Sign in
            </button>

            <div className="ls-secondaryLinkRow">
              Don&apos;t have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/create-account');
                }}
              >
                Create one
              </a>
            </div>
          </form>
        </section>

        <aside className="ls-authImageWrap" aria-label="Signin cover image">
          <div className="ls-authImageGlow" aria-hidden="true" />
          <img
            className="ls-authImage"
            src="/8605f54a5a6b8ac1f43ddee168402e00474c1f96.jpg"
            alt="Students collaborating on campus"
          />
        </aside>
      </main>
    </div>
  );
}

