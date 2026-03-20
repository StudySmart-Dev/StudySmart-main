import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext.jsx';
import * as api from '../../api/apiClient.js';

import '../../styles/dashboard.css';

function GraphSvg() {
  return (
    <svg className="ds-graphSvg" viewBox="0 0 760 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BEE3FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFB4D9" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="760" height="260" rx="18" fill="url(#g2)" opacity="0.18" />
      <path
        d="M30 210 C 90 150, 130 230, 190 165 C 250 100, 290 180, 350 150 C 410 120, 450 190, 510 165 C 570 140, 610 215, 700 145 L 700 240 L 30 240 Z"
        fill="url(#g1)"
        opacity="0.55"
      />
      <path
        d="M30 200 C 90 140, 130 220, 190 155 C 250 90, 290 170, 350 140 C 410 110, 450 180, 510 155 C 570 130, 610 205, 700 135"
        stroke="#0EA5E9"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.55"
        fill="none"
      />
    </svg>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 'min(920px, 100%)',
          background: '#fff',
          borderRadius: 22,
          border: '1px solid rgba(17, 17, 26, 0.10)',
          padding: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div style={{ fontWeight: 980, fontSize: 16 }}>{title}</div>
          <button className="ds-logoutBtn" type="button" onClick={onClose} style={{ padding: '8px 10px' }}>
            Close
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lowBandwidth } = useOutletContext();

  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [groups, setGroups] = useState([]);

  const [search, setSearch] = useState({ institution: '', courseCode: '', topic: '' });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });

  const [newNote, setNewNote] = useState({
    title: '',
    institution: '',
    courseCode: '',
    topic: '',
    content: ''
  });

  const [previewNote, setPreviewNote] = useState(null);

  function downloadText(filename, text) {
    const safeName = String(filename || 'StudySmart_Note')
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .slice(0, 120);

    const blob = new Blob([text || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName.endsWith('.txt') ? safeName : `${safeName}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      const [notesRes, usersRes, meetingsRes, groupsRes] = await Promise.all([
        api.getAll('notes'),
        api.getAll('users'),
        api.getAll('meetings'),
        api.getAll('groups')
      ]);
      if (!alive) return;
      setNotes(notesRes);
      setUsers(usersRes);
      setMeetings(meetingsRes);
      setGroups(groupsRes);
    }
    load().catch(() => {
      // if the API is down, just render the empty UI
    });
    return () => {
      alive = false;
    };
  }, []);

  const userById = useMemo(() => {
    const map = new Map();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const creditsByUserId = useMemo(() => {
    const credits = new Map();
    for (const n of notes) {
      const authorId = n.authorId;
      const next = (credits.get(authorId) || 0) + (Number(n.upvotes || 0) - Number(n.downvotes || 0));
      credits.set(authorId, next);
    }
    return credits;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const { institution, courseCode, topic } = search;
    const inst = institution.trim().toLowerCase();
    const cc = courseCode.trim().toLowerCase();
    const top = topic.trim().toLowerCase();

    return notes
      .filter((n) => {
        if (inst && !(n.institution || '').toLowerCase().includes(inst)) return false;
        if (cc && !(n.courseCode || '').toLowerCase().includes(cc)) return false;
        if (top && !(n.topic || '').toLowerCase().includes(top)) return false;
        return true;
      })
      .sort((a, b) => {
        const sa = Number(a.upvotes || 0) - Number(a.downvotes || 0);
        const sb = Number(b.upvotes || 0) - Number(b.downvotes || 0);
        return sb - sa;
      });
  }, [notes, search]);

  const topCredits = useMemo(() => {
    const sorted = [...creditsByUserId.entries()].sort((a, b) => b[1] - a[1]);
    return new Set(sorted.slice(0, 2).map((x) => x[0]));
  }, [creditsByUserId]);

  async function vote(note) {
    if (!user) return;
    const current = note;
    const existing = (current.votes || []).find((v) => Number(v.userId) === Number(user.id));
    const desired = -1;

    const nextVotes = [...(current.votes || [])].filter((v) => Number(v.userId) !== Number(user.id));

    // Toggle logic: clicking same direction removes vote; otherwise sets to desired
    const alreadySame = existing && Number(existing.value) === desired;
    if (!alreadySame) nextVotes.push({ userId: user.id, value: desired });

    const upvotes = nextVotes.filter((v) => v.value === 1).length;
    const downvotes = nextVotes.filter((v) => v.value === -1).length;

    const updated = { ...current, votes: nextVotes, upvotes, downvotes };
    const saved = await api.replace('notes', current.id, updated);
    setNotes((prev) => prev.map((n) => (n.id === current.id ? saved : n)));
  }

  async function upvote(note) {
    if (!user) return;
    const current = note;
    const existing = (current.votes || []).find((v) => Number(v.userId) === Number(user.id));
    const desired = 1;

    const nextVotes = [...(current.votes || [])].filter((v) => Number(v.userId) !== Number(user.id));
    const alreadySame = existing && Number(existing.value) === desired;
    if (!alreadySame) nextVotes.push({ userId: user.id, value: desired });

    const upvotes = nextVotes.filter((v) => v.value === 1).length;
    const downvotes = nextVotes.filter((v) => v.value === -1).length;

    const updated = { ...current, votes: nextVotes, upvotes, downvotes };
    const saved = await api.replace('notes', current.id, updated);
    setNotes((prev) => prev.map((n) => (n.id === current.id ? saved : n)));
  }

  const scheduled = useMemo(() => {
    return meetings
      .filter((m) => m.type === 'scheduled')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3);
  }, [meetings]);

  function groupById(id) {
    return groups.find((g) => Number(g.id) === Number(id));
  }

  return (
    <div className="ds-grid2" aria-label="Dashboard overview page">
      <section className="ds-card">
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Weekly Discussions</h3>
            <p className="ds-cardSub ds-cardSubtle">
              This shows an overview of your contributions to your desired groups and collaborations.
            </p>
          </div>
          <button className="ds-pillBtn" type="button">
            Filters ▾
          </button>
        </div>
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(17, 17, 26, 0.08)', background: 'rgba(250,250,255,0.55)' }}>
          <GraphSvg />
        </div>
      </section>

      <section className="ds-card">
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Note-Exchange Hub</h3>
            <p className="ds-cardSub ds-cardSubtle">
              Upload notes, search by institution/course/topic, and vote to rank top resources.
            </p>
          </div>
          <button
            className="ds-pillBtn"
            type="button"
            onClick={() => {
              setUploadStatus({ type: '', message: '' });
              setUploadOpen((v) => !v);
            }}
          >
            {uploadOpen ? 'Hide upload' : 'Upload note'}
          </button>
        </div>

        <div className="ds-notesToolbar" aria-label="Note search filters">
          <div className="ds-field">
            <label>Institution</label>
            <input
              className="ds-input"
              value={search.institution}
              onChange={(e) => setSearch((p) => ({ ...p, institution: e.target.value }))}
              placeholder="e.g., AmaliTech"
            />
          </div>
          <div className="ds-field">
            <label>Course Code</label>
            <input
              className="ds-input"
              value={search.courseCode}
              onChange={(e) => setSearch((p) => ({ ...p, courseCode: e.target.value }))}
              placeholder="e.g., CS101"
            />
          </div>
          <div className="ds-field">
            <label>Topic</label>
            <input
              className="ds-input"
              value={search.topic}
              onChange={(e) => setSearch((p) => ({ ...p, topic: e.target.value }))}
              placeholder="e.g., Data Structures"
            />
          </div>
        </div>

        {!uploadOpen && uploadStatus.message ? (
          <div
            style={{
              margin: '10px 0 6px',
              color: uploadStatus.type === 'error' ? '#b91c1c' : '#065f46',
              fontWeight: 900,
              fontSize: 13
            }}
            aria-live="polite"
          >
            {uploadStatus.message}
          </div>
        ) : null}

        {uploadOpen ? (
          <div style={{ marginBottom: 14 }}>
            <div className="ds-kvGrid">
              <label className="ds-field">
                <span style={{ fontSize: 11.5, fontWeight: 950, opacity: 0.7 }}>Title</span>
                <input
                  className="ds-input"
                  value={newNote.title}
                  onChange={(e) => setNewNote((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Enter note title"
                />
              </label>
              <label className="ds-field">
                <span style={{ fontSize: 11.5, fontWeight: 950, opacity: 0.7 }}>Institution</span>
                <input
                  className="ds-input"
                  value={newNote.institution}
                  onChange={(e) => setNewNote((p) => ({ ...p, institution: e.target.value }))}
                  placeholder="e.g., AmaliTech"
                />
              </label>
            </div>
            <div style={{ height: 10 }} />
            <div className="ds-kvGrid">
              <label className="ds-field">
                <span style={{ fontSize: 11.5, fontWeight: 950, opacity: 0.7 }}>Course Code</span>
                <input
                  className="ds-input"
                  value={newNote.courseCode}
                  onChange={(e) => setNewNote((p) => ({ ...p, courseCode: e.target.value }))}
                  placeholder="e.g., CS101"
                />
              </label>
              <label className="ds-field">
                <span style={{ fontSize: 11.5, fontWeight: 950, opacity: 0.7 }}>Topic</span>
                <input
                  className="ds-input"
                  value={newNote.topic}
                  onChange={(e) => setNewNote((p) => ({ ...p, topic: e.target.value }))}
                  placeholder="e.g., Data Structures"
                />
              </label>
            </div>

            <div style={{ height: 10 }} />
            <label className="ds-field">
              <span style={{ fontSize: 11.5, fontWeight: 950, opacity: 0.7 }}>Content</span>
              <textarea
                className="ds-textarea"
                style={{
                  width: '100%',
                  minHeight: 120,
                  borderRadius: 18,
                  border: '1px solid rgba(17, 17, 26, 0.14)',
                  background: '#fff',
                  padding: '12px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  outline: 'none',
                  resize: 'vertical'
                }}
                value={newNote.content}
                onChange={(e) => setNewNote((p) => ({ ...p, content: e.target.value }))}
                placeholder="Paste your note text here"
              />
            </label>

            <div style={{ height: 10 }} />
            <button
              className="ds-primaryBtn"
              type="button"
              onClick={async () => {
                if (!user) return;
                setUploadStatus({ type: '', message: '' });

                const title = newNote.title.trim();
                const content = newNote.content.trim();
                const institution = newNote.institution.trim();
                const courseCode = newNote.courseCode.trim();
                const topic = newNote.topic.trim();

                // Basic validation to prevent empty/low-quality uploads
                if (!title || title.length < 3) {
                  setUploadStatus({ type: 'error', message: 'Please enter a title (min 3 characters).' });
                  return;
                }
                if (!content || content.length < 20) {
                  setUploadStatus({ type: 'error', message: 'Please enter note content (min 20 characters).' });
                  return;
                }
                if (!institution || !courseCode || !topic) {
                  setUploadStatus({
                    type: 'error',
                    message: 'Please fill Institution, Course Code, and Topic for better discovery.'
                  });
                  return;
                }

                try {
                  setUploading(true);
                  const payload = {
                    title,
                    institution,
                    courseCode,
                    topic,
                    content,
                    authorId: user.id,
                    votes: [],
                    upvotes: 0,
                    downvotes: 0,
                    createdAt: new Date().toISOString()
                  };

                  const created = await api.create('notes', payload);
                  setNotes((prev) => [created, ...prev]);
                  setNewNote({ title: '', institution: '', courseCode: '', topic: '', content: '' });
                  setUploadOpen(false);
                  setUploadStatus({ type: 'success', message: 'Note uploaded successfully.' });
                } catch (err) {
                  setUploadStatus({ type: 'error', message: err?.message || 'Failed to upload note.' });
                } finally {
                  setUploading(false);
                }
              }}
            >
              {uploading ? 'Publishing...' : 'Publish note'}
            </button>

            {uploadStatus.message ? (
              <div
                style={{
                  marginTop: 10,
                  color: uploadStatus.type === 'error' ? '#b91c1c' : '#065f46',
                  fontWeight: 900,
                  fontSize: 13
                }}
              >
                {uploadStatus.message}
              </div>
            ) : null}
          </div>
        ) : null}

        {filteredNotes.length === 0 ? (
          <div
            style={{
              borderRadius: 18,
              border: '1px dashed rgba(17, 17, 26, 0.18)',
              background: 'rgba(250,250,255,0.55)',
              padding: 18,
              marginTop: 8
            }}
            aria-label="No notes found"
          >
            <div style={{ fontWeight: 980, fontSize: 16, marginBottom: 6 }}>
              No notes match your search.
            </div>
            <div style={{ fontWeight: 850, opacity: 0.65, fontSize: 13, lineHeight: 1.5 }}>
              Try clearing filters or uploading a new note to start building your study library.
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="ds-secondaryBtn"
                type="button"
                style={{ width: 'auto', padding: '10px 14px' }}
                onClick={() => setSearch({ institution: '', courseCode: '', topic: '' })}
              >
                Clear filters
              </button>
              <button
                className="ds-primaryBtn"
                type="button"
                style={{ width: 'auto', padding: '10px 14px' }}
                onClick={() => setUploadOpen(true)}
              >
                Upload note
              </button>
            </div>
          </div>
        ) : (
          <div className="ds-notesGrid" aria-label="Notes list">
            {filteredNotes.slice(0, 9).map((n) => {
            const author = userById.get(n.authorId);
            const myVote = (n.votes || []).find((v) => Number(v.userId) === Number(user?.id))?.value || 0;
            const authorIsTop = topCredits.has(n.authorId);
            return (
              <div className="ds-noteCard" key={n.id}>
                <div className="ds-noteTop">
                  <h4 className="ds-noteTitle">{n.title}</h4>
                  {authorIsTop ? <span className="ds-badge">Scholar</span> : null}
                </div>

                <div className="ds-noteMeta">
                  {n.institution} • {n.courseCode}
                  <br />
                  {n.topic}
                  <br />
                  By {author?.name || 'Student'}
                </div>

                <div className="ds-notePreview">
                  {lowBandwidth
                    ? n.content.slice(0, 180) + (n.content.length > 180 ? '...' : '')
                    : n.content.slice(0, 260) + (n.content.length > 260 ? '...' : '')}
                </div>

                <div className="ds-noteActions">
                  <button
                    type="button"
                    className={`ds-voteBtn ${myVote === 1 ? 'isOnUp' : ''}`}
                    onClick={() => upvote(n)}
                    aria-label="Upvote note"
                  >
                    ▲ {n.upvotes || 0}
                  </button>
                  <button
                    type="button"
                    className={`ds-voteBtn ${myVote === -1 ? 'isOnDown' : ''}`}
                    onClick={() => vote(n)}
                    aria-label="Downvote note"
                  >
                    ▼ {n.downvotes || 0}
                  </button>
                  <button type="button" className="ds-linkBtn" onClick={() => setPreviewNote(n)}>
                    Preview
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </section>

      <section className="ds-card">
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Scheduled Meetings</h3>
            <p className="ds-cardSub ds-cardSubtle">Join a session for group discussions or quick doubt clearing.</p>
          </div>
        </div>

        <div className="ds-meetingsGrid">
          {scheduled.map((m) => {
            const g = groupById(m.groupId);
            const when = new Date(m.scheduledAt).toLocaleString();
            return (
              <div className="ds-meetingCard" key={m.id}>
                <h4 className="ds-meetingTitle">{m.title}</h4>
                <div className="ds-meetingLine">
                  {g?.courseCode} • {g?.topic}
                </div>
                <div className="ds-meetingLine">{when}</div>
                <div className="ds-meetingLine">Duration: {m.durationMinutes} min</div>
                <button
                  className="ds-primaryBtn"
                  type="button"
                  onClick={() => navigate(`/dashboard/room/${m.id}`)}
                >
                  Join room
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {previewNote ? (
        <Modal
          title="Note Preview"
          onClose={() => setPreviewNote(null)}
        >
          <div style={{ padding: 6 }}>
            <div style={{ fontWeight: 980, fontSize: 18, marginBottom: 6 }}>{previewNote.title}</div>
            <div style={{ fontWeight: 900, opacity: 0.65, fontSize: 13, marginBottom: 10 }}>
              {previewNote.institution} • {previewNote.courseCode} • {previewNote.topic}
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontWeight: 850,
                opacity: 0.75,
                lineHeight: 1.5,
                border: '1px solid rgba(17, 17, 26, 0.08)',
                borderRadius: 18,
                padding: 12,
                background: 'rgba(250,250,255,0.65)'
              }}
            >
              {previewNote.content}
            </div>

            <div className="ds-actionRow">
              <button
                className="ds-secondaryBtn ds-actionBtn"
                type="button"
                onClick={() => {
                  downloadText(previewNote.title || 'StudySmart_Note', previewNote.content);
                }}
              >
                Download note
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

