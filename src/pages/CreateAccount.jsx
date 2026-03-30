import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TopNav from '../ui/TopNav.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { CSM_COURSES } from '../data/csmCourses.js';

import '../styles/auth.css';

const coverImgSrc = '/8605f54a5a6b8ac1f43ddee168402e00474c1f96.jpg';

export default function CreateAccount() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    course: '',
    level: '',
  });

  const [error, setError] = useState('');

  function setField(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <div className="ls-authPage">
      <TopNav />

      <main className="ls-authMain">
        <section className="ls-authForm" aria-label="Create account form">
          <h1 className="ls-authHeading">Create Your Account</h1>
          <p className="ls-authSub">Create your account on StudySmart</p>

          <form
            className="ls-formGrid"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');

              if (form.password !== form.confirmPassword) {
                setError('Passwords do not match');
                return;
              }
              if (!form.institution.trim()) {
                setError('Institution / school is required');
                return;
              }

              try {
                const payload = {
                  name: form.name.trim(),
                  email: form.email.trim(),
                  password: form.password,
                  institution: form.institution.trim(),
                  course: form.course,
                  level: form.level,
                  learningStyle: 'Visual',
                  availability: 'Evenings',
                  xp: 0,
                  rankTier: 1,
                  upvoteCount: 0,
                  downvoteCount: 0,
                  notesCreatedCount: 0,
                  joinedRoomsCount: 0,
                  chatMessagesCount: 0,
                  boardStrokesCount: 0,
                  badges: []
                };

                await signup(payload);
                navigate('/dashboard');
              } catch (err) {
                setError(err?.message || 'Failed to create account');
              }
            }}
          >
            <label>
              <span className="ls-fieldLabel">Name</span>
              <input
                className="ls-input"
                value={form.name}
                onChange={setField('name')}
                placeholder="John Doe"
                autoComplete="name"
              />
            </label>

            <label>
              <span className="ls-fieldLabel">Email</span>
              <input
                className="ls-input"
                value={form.email}
                onChange={setField('email')}
                placeholder="johndoe@gmail.com"
                autoComplete="email"
              />
            </label>

            <div className="ls-row2Tight">
              <label>
                <span className="ls-fieldLabel">Password</span>
                <input
                  type="password"
                  className="ls-input"
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="************"
                  autoComplete="new-password"
                />
              </label>

              <label>
                <span className="ls-fieldLabel">Confirm Password</span>
                <input
                  type="password"
                  className="ls-input"
                  value={form.confirmPassword}
                  onChange={setField('confirmPassword')}
                  placeholder="************"
                  autoComplete="new-password"
                />
              </label>
            </div>

            <label>
              <span className="ls-fieldLabel">Institution / School</span>
              <input
                className="ls-input"
                value={form.institution}
                onChange={setField('institution')}
                placeholder="e.g., KNUST"
                autoComplete="organization"
              />
            </label>

            <div className="ls-row2Tight">
              <label>
                <span className="ls-fieldLabel">Course</span>
                <select
                  className="ls-input ls-select"
                  value={form.course}
                  onChange={setField('course')}
                >
                  <option value="">Select</option>
                  {CSM_COURSES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="ls-fieldLabel">Level</span>
                <select
                  className="ls-input ls-select"
                  value={form.level}
                  onChange={setField('level')}
                >
                  <option value="">Select</option>
                  <option value="ug">Undergraduate</option>
                  <option value="grad">Graduate</option>
                </select>
              </label>
            </div>

            <button className="ls-primaryBtn" type="submit">
              Create Account
            </button>

            {error ? (
              <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: 13 }}>{error}</div>
            ) : null}

            <div className="ls-secondaryLinkRow">
              Have account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signin');
                }}
              >
                Sign in
              </a>
            </div>
          </form>
        </section>

        <aside className="ls-authImageWrap" aria-label="Create account cover image">
          <div className="ls-authImageGlow" aria-hidden="true" />
          <img className="ls-authImage" src={coverImgSrc} alt="Students collaborating on campus" />
        </aside>
      </main>
    </div>
  );
}

