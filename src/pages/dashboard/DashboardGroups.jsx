import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext.jsx';
import * as api from '../../api/apiClient.js';
import { hasBadge } from '../../achievements/achievementEngine.js';

import '../../styles/dashboard.css';

const LEARNING_STYLES = ['Visual', 'Verbal'];
const AVAILABILITY = ['Mornings', 'Afternoons', 'Evenings'];

export default function DashboardGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [notes, setNotes] = useState([]);
  const [toast, setToast] = useState('');

  const [filters, setFilters] = useState({
    institution: '',
    courseCode: '',
    topic: '',
    learningStyle: '',
    availability: ''
  });

  useEffect(() => {
    let alive = true;
    async function load() {
      const settled = await Promise.allSettled([api.getAll('groups'), api.getAll('notes')]);
      if (!alive) return;
      if (settled[0].status === 'fulfilled') setGroups(settled[0].value);
      if (settled[1].status === 'fulfilled') setNotes(settled[1].value);
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const uniqueCourseCodes = useMemo(() => {
    const s = new Set(groups.map((g) => g.courseCode).filter(Boolean));
    return [...s];
  }, [groups]);

  const uniqueInstitutions = useMemo(() => {
    const s = new Set(groups.map((g) => g.institution).filter(Boolean));
    return [...s];
  }, [groups]);

  const interestByTopic = useMemo(() => {
    const map = new Map();
    if (!user) return map;
    for (const n of notes) {
      const v = (n.votes || []).find((x) => Number(x.userId) === Number(user.id));
      if (!v || !n.topic) continue;
      const key = String(n.topic).toLowerCase();
      const delta = Number(v.value) === 1 ? 1 : -1;
      map.set(key, (map.get(key) || 0) + delta);
    }
    return map;
  }, [notes, user]);

  const matches = useMemo(() => {
    const inst = filters.institution.trim().toLowerCase();
    const cc = filters.courseCode.trim().toLowerCase();
    const top = filters.topic.trim().toLowerCase();
    const ls = filters.learningStyle;
    const av = filters.availability;

    function score(g) {
      let s = 0;
      if (cc && (g.courseCode || '').toLowerCase() === cc) s += 2.5;
      if (inst && (g.institution || '').toLowerCase() === inst) s += 1.75;
      if (top && (g.topic || '').toLowerCase().includes(top)) s += 1.25;
      if (ls && (g.learningStyles || []).includes(ls)) s += 1.5;
      if (av && (g.availability || []).includes(av)) s += 1.5;

      // AI-like scoring based on what the user actively rewarded/criticized.
      if (user && interestByTopic.size) {
        const gTopic = String(g.topic || '').toLowerCase();
        let topicScore = 0;
        for (const [t, sc] of interestByTopic.entries()) {
          if (!t) continue;
          if (gTopic.includes(t)) topicScore += sc;
        }
        // Normalize a bit to avoid overwhelming filter scores
        s += Math.max(-1.5, Math.min(1.5, topicScore * 0.6));
      }

      // Rank & badges influence recommendation visibility.
      if (user) {
        const rankBoost = Math.max(0, Number(user.rankTier || 1) - 1) * 0.12;
        s += Math.min(1.2, rankBoost);
        if (hasBadge(user, 'Strict monitor')) s += 0.6;
      }

      // Prefer groups the user hasn't joined yet (small boost)
      if (user && !(g.members || []).includes(user.id)) s += 0.35;
      return s;
    }

    return groups
      .map((g) => ({ g, s: score(g) }))
      .filter((x) => x.s > 0 || (!inst && !cc && !top && !ls && !av))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.g);
  }, [groups, filters, user, interestByTopic]);

  return (
    <div className="ds-grid2" aria-label="Dashboard groups page">
      <section className="ds-card">
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Study Group Discovery</h3>
            <p className="ds-cardSub ds-cardSubtle">Frontend-based study matcher using course, topic, and availability.</p>
          </div>
          {toast ? <span className="ds-badge">{toast}</span> : null}
        </div>

        <div className="ds-notesToolbar" aria-label="Study matcher filters">
          <div className="ds-field">
            <label>Institution</label>
            <select
              className="ds-input"
              value={filters.institution}
              onChange={(e) => setFilters((p) => ({ ...p, institution: e.target.value }))}
            >
              <option value="">Any</option>
              {uniqueInstitutions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="ds-field">
            <label>Course Code</label>
            <select
              className="ds-input"
              value={filters.courseCode}
              onChange={(e) => setFilters((p) => ({ ...p, courseCode: e.target.value }))}
            >
              <option value="">Any</option>
              {uniqueCourseCodes.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="ds-field">
            <label>Topic</label>
            <input
              className="ds-input"
              value={filters.topic}
              onChange={(e) => setFilters((p) => ({ ...p, topic: e.target.value }))}
              placeholder="e.g., Circuits"
            />
          </div>

          <div className="ds-field">
            <label>Learning Style</label>
            <select
              className="ds-input"
              value={filters.learningStyle}
              onChange={(e) => setFilters((p) => ({ ...p, learningStyle: e.target.value }))}
            >
              <option value="">Any</option>
              {LEARNING_STYLES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="ds-field">
            <label>Availability</label>
            <select
              className="ds-input"
              value={filters.availability}
              onChange={(e) => setFilters((p) => ({ ...p, availability: e.target.value }))}
            >
              <option value="">Any</option>
              {AVAILABILITY.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="ds-card">
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Matched Groups</h3>
            <p className="ds-cardSub ds-cardSubtle">{matches.length} groups found.</p>
          </div>
        </div>

        <div className="ds-notesGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {matches.slice(0, 9).map((g) => {
            const joined = user ? (g.members || []).includes(user.id) : false;
            return (
              <div className="ds-noteCard" key={g.id} style={{ padding: 16 }}>
                <div className="ds-noteTop">
                  <h4 className="ds-noteTitle">
                    {g.courseCode} • {g.topic}
                  </h4>
                  {joined ? <span className="ds-badge">Joined</span> : null}
                </div>
                <div className="ds-noteMeta">
                  {g.institution}
                  <br />
                  Learning: {(g.learningStyles || []).join(', ') || '—'}
                  <br />
                  Availability: {(g.availability || []).join(', ') || '—'}
                </div>
                <div className="ds-notePreview">{g.description}</div>
                <div className="ds-noteActions" style={{ gap: 0 }}>
                  <button
                    className={joined ? 'ds-secondaryBtn' : 'ds-primaryBtn'}
                    type="button"
                    onClick={async () => {
                      if (!user) return;
                      if (joined) return;
                      const scheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
                      const meetingPayload = {
                        type: 'scheduled',
                        title: `Study session: ${g.courseCode} • ${g.topic}`,
                        groupId: g.id,
                        scheduledAt,
                        durationMinutes: 60,
                        participants: [user.id]
                      };
                      const createdMeeting = await api.create('meetings', meetingPayload);
                      const nextMembers = Array.from(new Set([...(g.members || []), user.id]));
                      await api.replace('groups', g.id, { ...g, members: nextMembers });
                      setToast('Requested to join');
                      navigate(`/dashboard/room/${createdMeeting.id}`);
                    }}
                  >
                    {joined ? 'Open room' : 'Request to join'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

