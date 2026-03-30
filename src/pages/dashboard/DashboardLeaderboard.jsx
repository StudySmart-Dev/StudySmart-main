import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth/AuthContext.jsx';
import * as api from '../../api/apiClient.js';

import { getTierByXp, hasBadge, BADGES } from '../../achievements/achievementEngine.js';

import '../../styles/dashboard.css';

export default function DashboardLeaderboard() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [scope, setScope] = useState('global'); // global | course | school | learningStyle
  const [courseFilter, setCourseFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [learningStyleFilter, setLearningStyleFilter] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      const [usersRes, notesRes] = await Promise.all([api.getAll('users'), api.getAll('notes')]);
      if (!alive) return;
      setUsers(usersRes);
      setNotes(notesRes);
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const institutionByUser = useMemo(() => {
    const map = new Map();
    const counts = new Map(); // userId -> Map(institution->count)

    for (const n of notes) {
      if (!n?.institution) continue;
      const authorId = Number(n.authorId);
      const uMap = counts.get(authorId) || new Map();
      uMap.set(n.institution, (uMap.get(n.institution) || 0) + 1);
      counts.set(authorId, uMap);
    }

    for (const [userId, uMap] of counts.entries()) {
      let best = null;
      let bestCount = -1;
      for (const [inst, c] of uMap.entries()) {
        if (c > bestCount) {
          best = inst;
          bestCount = c;
        }
      }
      map.set(userId, best);
    }
    return map;
  }, [notes]);

  const courseOptions = useMemo(() => {
    const s = new Set(users.map((u) => u.course).filter(Boolean));
    return [...s];
  }, [users]);

  const schoolOptions = useMemo(() => {
    const s = new Set(Array.from(institutionByUser.values()).filter(Boolean));
    return [...s];
  }, [institutionByUser]);

  const learningStyleOptions = useMemo(() => {
    const s = new Set(users.map((u) => u.learningStyle).filter(Boolean));
    return [...s];
  }, [users]);

  const leaderboard = useMemo(() => {
    const rows = users
      .map((u) => {
        const tier = getTierByXp(u.xp);
        const institution = institutionByUser.get(Number(u.id)) || '';
        return { u, tier, institution };
      })
      .filter((row) => {
        if (scope === 'course') return !courseFilter || row.u.course === courseFilter;
        if (scope === 'school') return !schoolFilter || row.institution === schoolFilter;
        if (scope === 'learningStyle') {
          return !learningStyleFilter || row.u.learningStyle === learningStyleFilter;
        }
        return true;
      })
      .sort((a, b) => {
        // Best ranked: tier first, then XP
        if (b.tier.tier !== a.tier.tier) return b.tier.tier - a.tier.tier;
        return Number(b.u.xp || 0) - Number(a.u.xp || 0);
      });
    return rows;
  }, [users, scope, courseFilter, schoolFilter, learningStyleFilter, institutionByUser]);

  const top = leaderboard.slice(0, 12);

  return (
    <div className="ds-grid2" aria-label="Leaderboard page">
      <section className="ds-card" style={{ gridColumn: '1 / -1' }}>
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Scholar Credits Leaderboard</h3>
            <p className="ds-cardSub ds-cardSubtle">
              Ranked by XP tier, then total XP. Badges such as <strong>{BADGES.STRICT_MONITOR}</strong> appear on cards;
              study group matching also weighs badges in its score.
            </p>
          </div>
        </div>

        <div className="ds-notesToolbar" style={{ marginTop: 8 }}>
          <div className="ds-field">
            <label>Leaderboard scope</label>
            <select className="ds-input" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="global">Global</option>
              <option value="course">By course</option>
              <option value="school">By school</option>
              <option value="learningStyle">By learning style</option>
            </select>
          </div>

          {scope === 'course' ? (
            <div className="ds-field">
              <label>Course</label>
              <select className="ds-input" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                <option value="">All</option>
                {courseOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {scope === 'school' ? (
            <div className="ds-field">
              <label>School</label>
              <select className="ds-input" value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
                <option value="">All</option>
                {schoolOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {scope === 'learningStyle' ? (
            <div className="ds-field">
              <label>Learning style</label>
              <select
                className="ds-input"
                value={learningStyleFilter}
                onChange={(e) => setLearningStyleFilter(e.target.value)}
              >
                <option value="">All</option>
                {learningStyleOptions.map((ls) => (
                  <option key={ls} value={ls}>
                    {ls}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="ds-notesGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {top.map((row, idx) => {
              const isMe = user?.id && Number(row.u.id) === Number(user.id);
              const strict = hasBadge(row.u, BADGES.STRICT_MONITOR);
              return (
                <div key={row.u.id} className="ds-noteCard" style={{ padding: 16, background: isMe ? 'rgba(212,231,255,0.6)' : undefined }}>
                  <div className="ds-noteTop">
                    <h4 className="ds-noteTitle">
                      #{idx + 1} {row.u.name}
                    </h4>
                    {strict ? <span className="ds-badge">Strict</span> : null}
                  </div>
                  <div className="ds-noteMeta">
                    {row.tier.name} • {row.u.xp || 0} XP
                    <br />
                    {row.u.course || '—'} • {row.institution || '—'}
                  </div>
                  <div className="ds-notePreview" style={{ opacity: 0.62 }}>
                    Badges: {(row.u.badges || []).length ? (row.u.badges || []).slice(0, 2).map((b) => (typeof b === 'string' ? b : b?.name)).join(', ') : '—'}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                    {isMe ? <span className="ds-badge" style={{ background: 'rgba(45,212,191,0.12)' }}>You</span> : null}
                    {hasBadge(row.u, BADGES.FIRST_UPLOAD) ? <span className="ds-badge">Uploader</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

