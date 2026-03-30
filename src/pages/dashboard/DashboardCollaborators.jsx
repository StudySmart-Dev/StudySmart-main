import React, { useEffect, useMemo, useState } from 'react';

import * as api from '../../api/apiClient.js';
import { useAuth } from '../../auth/AuthContext.jsx';

import '../../styles/dashboard.css';

function letterFromName(name) {
  const s = (name || '').trim();
  return s ? s[0].toUpperCase() : '?';
}

export default function DashboardCollaborators() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const settled = await Promise.allSettled([api.getAll('users'), api.getAll('notes')]);
      if (!alive) return;
      if (settled[0].status === 'fulfilled') setUsers(settled[0].value);
      if (settled[1].status === 'fulfilled') setNotes(settled[1].value);
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const creditsByUserId = useMemo(() => {
    const map = new Map();
    for (const u of users) map.set(u.id, 0);
    for (const n of notes) {
      const authorId = n.authorId;
      const next = (map.get(authorId) || 0) + (Number(n.upvotes || 0) - Number(n.downvotes || 0));
      map.set(authorId, next);
    }
    return map;
  }, [users, notes]);

  const ranked = useMemo(() => {
    return [...creditsByUserId.entries()]
      .map(([id, credits]) => ({ id, credits }))
      .sort((a, b) => b.credits - a.credits);
  }, [creditsByUserId]);

  const topUserIds = new Set(ranked.slice(0, 2).map((x) => x.id));

  return (
    <div className="ds-grid2" aria-label="Dashboard collaborators page">
      <section className="ds-card">
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Collaborators</h3>
            <p className="ds-cardSub ds-cardSubtle">Scholar credits computed from upvoted notes.</p>
          </div>
        </div>

        <div className="ds-notesGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {users
            .slice()
            .sort((a, b) => (creditsByUserId.get(b.id) || 0) - (creditsByUserId.get(a.id) || 0))
            .map((u) => {
              const credits = creditsByUserId.get(u.id) || 0;
              const isTop = topUserIds.has(u.id);
              return (
                <div className="ds-noteCard" key={u.id} style={{ padding: 16 }}>
                  <div className="ds-noteTop">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        aria-hidden="true"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 999,
                          border: '1px solid rgba(17,17,26,0.08)',
                          background: u.id === user?.id ? 'rgba(212, 231, 255, 0.8)' : 'rgba(255,255,255,0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 950
                        }}
                      >
                        {letterFromName(u.name)}
                      </div>
                      <div>
                        <div className="ds-noteTitle">{u.name}</div>
                        <div className="ds-noteMeta" style={{ marginTop: 3 }}>
                          {u.course || '—'} • {u.level || '—'}
                        </div>
                      </div>
                    </div>
                    {isTop ? <span className="ds-badge">Scholar</span> : null}
                  </div>

                  <div className="ds-noteMeta" style={{ marginTop: 4 }}>
                    Credits: <strong style={{ opacity: 0.9 }}>{credits}</strong>
                  </div>

                  <div className="ds-notePreview" style={{ opacity: 0.65 }}>
                    Learning style: {(u.learningStyle || '—').toString()}
                    <br />
                    Availability: {(u.availability || '—').toString()}
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}

