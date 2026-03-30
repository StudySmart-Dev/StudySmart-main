import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext.jsx';
import * as api from '../../api/apiClient.js';
import {
  awardForDownvote,
  awardForNoteUpload,
  awardForUpvote,
  normalizeUser
} from '../../achievements/achievementEngine.js';
import { CSM_COURSES, topicForCourseCode, UI_SEED_REVISION } from '../../data/csmCourses.js';

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
  const { user, updateUser } = useAuth();
  const { lowBandwidth } = useOutletContext();

  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [groups, setGroups] = useState([]);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [xpToast, setXpToast] = useState('');

  const [uploadDraft, setUploadDraft] = useState({
    courseCode: '',
    content: ''
  });
  const [noteFile, setNoteFile] = useState(null);

  const [previewNote, setPreviewNote] = useState(null);
  const [quizShowAnswers, setQuizShowAnswers] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainText, setExplainText] = useState('');
  const [customExplainPrompt, setCustomExplainPrompt] = useState('');

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
      const settled = await Promise.allSettled([
        api.getAll('notes'),
        api.getAll('users'),
        api.getAll('meetings'),
        api.getAll('groups')
      ]);
      if (!alive) return;
      const [notesRes, usersRes, meetingsRes, groupsRes] = settled;
      if (notesRes.status === 'fulfilled') setNotes(notesRes.value);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value);
      if (meetingsRes.status === 'fulfilled') setMeetings(meetingsRes.value);
      if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value);
    }
    load().catch(() => {
      // if the API is down, just render the empty UI
    });
    return () => {
      alive = false;
    };
  }, []);

  function noteCardBlurb(n) {
    const ai = (n.aiCardSummary || n.aiSummary || '').trim();
    if (ai) {
      const max = lowBandwidth ? 160 : 260;
      return ai.length > max ? `${ai.slice(0, max)}…` : ai;
    }
    const c = (n.content || '').trim();
    const max = lowBandwidth ? 140 : 220;
    return c.length > max ? `${c.slice(0, max)}…` : c;
  }

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

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const sa = Number(a.upvotes || 0) - Number(a.downvotes || 0);
      const sb = Number(b.upvotes || 0) - Number(b.downvotes || 0);
      return sb - sa;
    });
  }, [notes]);

  useEffect(() => {
    if (!xpToast) return;
    const t = window.setTimeout(() => setXpToast(''), 2500);
    return () => window.clearTimeout(t);
  }, [xpToast]);

  useEffect(() => {
    setQuizShowAnswers(false);
    setExplainText('');
    setCustomExplainPrompt('');
  }, [previewNote]);

  const smartTools = useMemo(() => {
    if (!previewNote) return null;
    const raw = String(previewNote.content || '');
    const lines = raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const sentences = raw
      .replace(/\n/g, ' ')
      .split(/[.!?]+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);

    const topSummary = (lowBandwidth ? sentences.slice(0, 2) : sentences.slice(0, 3)).slice(0, 3);
    const summary =
      String(previewNote.aiSummary || '').trim() ||
      topSummary.join('. ') ||
      (lines[0] ? lines[0] : 'No summary available.');

    const practiceLine = lines.find((l) => l.toLowerCase().startsWith('practice')) || lines.find((l) => l.toLowerCase().includes('practice'));
    const keyLine = lines.find((l) => l.toLowerCase().includes('preorder') || l.toLowerCase().includes('inorder') || l.toLowerCase().includes('postorder') || l.toLowerCase().includes('kcl') || l.toLowerCase().includes('kvl'));
    const lastLine = lines[lines.length - 1] || '';

    const quiz = [
      {
        q: `In your own words, what is the main idea of “${previewNote.topic}”?`,
        a: summary
      },
      {
        q: 'Which key rule/definition should you remember from this note?',
        a: keyLine || lines[1] || summary
      },
      {
        q: 'What practice step would you do next (from the note)?',
        a: practiceLine || 'Take the next section and try one example from start to finish.'
      },
      {
        q: 'What should you review right before the exam/problem set?',
        a: lastLine || 'Re-read the summary and ensure you can apply it to one new example.'
      }
    ];

    return { summary, quiz };
  }, [previewNote, lowBandwidth]);

  async function persistUserUpdated(nextUser, earned) {
    if (!nextUser?.id) return;
    const saved = await api.replace('users', nextUser.id, nextUser);
    updateUser(saved);
    if (earned?.xpDelta) {
      setXpToast(`+${earned.xpDelta} XP`);
    }
    if (earned?.badges && earned.badges.length) {
      setXpToast(`Badge earned: ${earned.badges[0]}`);
    }
  }

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
    const nextVote = alreadySame ? 0 : desired;
    if (!alreadySame) nextVotes.push({ userId: user.id, value: desired });

    const upvotes = nextVotes.filter((v) => v.value === 1).length;
    const downvotes = nextVotes.filter((v) => v.value === -1).length;

    const updated = { ...current, votes: nextVotes, upvotes, downvotes };
    const saved = await api.replace('notes', current.id, updated);
    setNotes((prev) => prev.map((n) => (n.id === current.id ? saved : n)));

    // XP awarding only when vote is set (not removed)
    if (nextVote === -1) {
      const { user: nextUser, earned } = awardForDownvote({ user: normalizeUser(user) });
      await persistUserUpdated(nextUser, earned);
    }
  }

  async function upvote(note) {
    if (!user) return;
    const current = note;
    const existing = (current.votes || []).find((v) => Number(v.userId) === Number(user.id));
    const desired = 1;

    const nextVotes = [...(current.votes || [])].filter((v) => Number(v.userId) !== Number(user.id));
    const alreadySame = existing && Number(existing.value) === desired;
    const nextVote = alreadySame ? 0 : desired;
    if (!alreadySame) nextVotes.push({ userId: user.id, value: desired });

    const upvotes = nextVotes.filter((v) => v.value === 1).length;
    const downvotes = nextVotes.filter((v) => v.value === -1).length;

    const updated = { ...current, votes: nextVotes, upvotes, downvotes };
    const saved = await api.replace('notes', current.id, updated);
    setNotes((prev) => prev.map((n) => (n.id === current.id ? saved : n)));

    // XP awarding only when vote is set (not removed)
    if (nextVote === 1) {
      const { user: nextUser, earned } = awardForUpvote({ user: normalizeUser(user), xpDelta: 2 });
      await persistUserUpdated(nextUser, earned);
    }
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
              Notes list by popularity. Upload: pick your course, optional text or a file—school and title come from your profile and AI.
            </p>
            <p
              className="ds-cardSub ds-cardSubtle"
              style={{ fontSize: 10, opacity: 0.45, marginTop: 6, marginBottom: 0 }}
              title="If this line is missing or shows old wording above, your browser or host is serving an older build."
            >
              UI revision: {UI_SEED_REVISION}
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

        {xpToast ? (
          <div
            style={{
              margin: '10px 0 6px',
              color: '#0b0b0f',
              fontWeight: 950,
              fontSize: 13,
              background: 'rgba(212, 231, 255, 0.7)',
              border: '1px solid rgba(17, 17, 26, 0.08)',
              padding: '8px 12px',
              borderRadius: 14
            }}
            aria-live="polite"
          >
            {xpToast}
          </div>
        ) : null}

        {uploadOpen ? (
          <div style={{ marginBottom: 14 }}>
            {user?.institution ? (
              <div style={{ fontSize: 12.5, fontWeight: 850, opacity: 0.65, marginBottom: 10 }}>
                Institution: <strong style={{ opacity: 0.95 }}>{user.institution}</strong> (from your profile)
              </div>
            ) : null}

            <label className="ds-field">
              <span style={{ fontSize: 11.5, fontWeight: 950, opacity: 0.7 }}>Course</span>
              <select
                className="ds-input"
                value={uploadDraft.courseCode}
                onChange={(e) => setUploadDraft((p) => ({ ...p, courseCode: e.target.value }))}
              >
                <option value="">Choose a course…</option>
                {CSM_COURSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ height: 10 }} />
            <label className="ds-field">
              <span style={{ fontSize: 11.5, fontWeight: 950, opacity: 0.7 }}>
                Optional: type or paste notes
              </span>
              <textarea
                className="ds-textarea"
                style={{
                  width: '100%',
                  minHeight: 100,
                  borderRadius: 18,
                  border: '1px solid rgba(17, 17, 26, 0.14)',
                  background: '#fff',
                  padding: '12px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  outline: 'none',
                  resize: 'vertical'
                }}
                value={uploadDraft.content}
                onChange={(e) => setUploadDraft((p) => ({ ...p, content: e.target.value }))}
                placeholder="Or leave empty if you only upload a file below."
              />
            </label>

            <div style={{ height: 10 }} />
            <label className="ds-field">
              <span style={{ fontSize: 11.5, fontWeight: 950, opacity: 0.7 }}>
                Upload file (PDF, Word, PowerPoint, image, or text)
              </span>
              <input
                className="ds-input"
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.md,.json,.png,.jpg,.jpeg,.webp,.gif"
                onChange={(e) => setNoteFile(e.target.files?.[0] || null)}
              />
            </label>

            <div style={{ height: 10 }} />
            <button
              className="ds-primaryBtn"
              type="button"
              onClick={async () => {
                if (!user) return;
                setUploadStatus({ type: '', message: '' });

                const content = uploadDraft.content.trim();
                const courseCode = uploadDraft.courseCode.trim();
                const topic = topicForCourseCode(courseCode);
                const institution = (user.institution || '').trim();

                if (!institution) {
                  setUploadStatus({
                    type: 'error',
                    message: 'Your account needs a school on file before you can publish.'
                  });
                  return;
                }
                if (!courseCode || !topic) {
                  setUploadStatus({ type: 'error', message: 'Choose a course from the list.' });
                  return;
                }
                if (!content && !noteFile) {
                  setUploadStatus({ type: 'error', message: 'Add some text or choose a file to upload.' });
                  return;
                }

                if (noteFile) {
                  const ext = (noteFile.name.split('.').pop() || '').toLowerCase();
                  const allowed = ['pdf', 'docx', 'pptx', 'txt', 'md', 'json', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
                  if (!allowed.includes(ext)) {
                    setUploadStatus({
                      type: 'error',
                      message: 'Unsupported file type.'
                    });
                    return;
                  }
                }

                try {
                  setUploading(true);
                  const fd = new FormData();
                  fd.append('title', '');
                  fd.append('institution', institution);
                  fd.append('courseCode', courseCode);
                  fd.append('topic', topic);
                  fd.append('authorId', String(user.id));
                  fd.append('content', content);
                  if (noteFile) fd.append('file', noteFile);

                  const { note: created } = await api.uploadNoteWithFile(fd);
                  setNotes((prev) => [created, ...prev]);
                  setUploadDraft({ courseCode: '', content: '' });
                  setNoteFile(null);
                  setUploadOpen(false);
                  setUploadStatus({ type: 'success', message: 'Note published.' });
                  setPreviewNote(created);

                  const { user: nextUser, earned } = awardForNoteUpload({ user: normalizeUser(user), xp: 15 });
                  await persistUserUpdated(nextUser, earned);
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

        {sortedNotes.length === 0 ? (
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
              No notes yet.
            </div>
            <div style={{ fontWeight: 850, opacity: 0.65, fontSize: 13, lineHeight: 1.5 }}>
              Publish a note to see it here. Course code and topic are only asked in the upload form.
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
            {sortedNotes.slice(0, 9).map((n) => {
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

                <div className="ds-notePreview" style={{ lineHeight: 1.45 }}>
                  <span style={{ fontSize: 11, fontWeight: 950, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.04 }}>
                    Summary
                  </span>
                  <br />
                  {noteCardBlurb(n)}
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
            <div style={{ fontWeight: 900, opacity: 0.65, fontSize: 13, marginBottom: 12 }}>
              {previewNote.institution} • {previewNote.courseCode} • {previewNote.topic}
            </div>

            {smartTools ? (
              <div
                style={{
                  marginBottom: 14,
                  border: '1px solid rgba(17, 17, 26, 0.08)',
                  borderRadius: 18,
                  padding: 14,
                  background: 'rgba(255,255,255,0.92)'
                }}
              >
                <div style={{ fontWeight: 980, marginBottom: 8, fontSize: 14 }}>AI summary</div>
                <div style={{ fontWeight: 850, opacity: 0.8, lineHeight: 1.45, fontSize: 13, whiteSpace: 'pre-wrap' }}>
                  {smartTools.summary}
                </div>
              </div>
            ) : null}

            <div style={{ fontWeight: 980, fontSize: 14, marginBottom: 8 }}>Full note</div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontWeight: 850,
                opacity: 0.75,
                lineHeight: 1.5,
                border: '1px solid rgba(17, 17, 26, 0.08)',
                borderRadius: 18,
                padding: 12,
                background: 'rgba(250,250,255,0.65)',
                maxHeight: 'min(52vh, 420px)',
                overflow: 'auto'
              }}
            >
              {previewNote.content}
            </div>

            {smartTools ? (
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    border: '1px solid rgba(17, 17, 26, 0.08)',
                    borderRadius: 18,
                    padding: 14,
                    background: 'rgba(255,255,255,0.88)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontWeight: 980, fontSize: 14 }}>Practice Quiz</div>
                    <button
                      className="ds-pillBtn"
                      type="button"
                      style={{ padding: '8px 10px' }}
                      onClick={() => setQuizShowAnswers((v) => !v)}
                    >
                      {quizShowAnswers ? 'Hide answers' : 'Reveal answers'}
                    </button>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {smartTools.quiz.map((item, idx) => (
                      <div key={idx} style={{ borderRadius: 14, border: '1px solid rgba(17, 17, 26, 0.06)', padding: 10, background: 'rgba(250,250,255,0.6)' }}>
                        <div style={{ fontWeight: 980, fontSize: 12.5, opacity: 0.9, marginBottom: 4 }}>{idx + 1}. {item.q}</div>
                        <div style={{ fontWeight: 850, opacity: quizShowAnswers ? 0.8 : 0.35, lineHeight: 1.45, fontSize: 13 }}>
                          {quizShowAnswers ? item.a : 'Answer hidden (tap reveal answers).'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div
              style={{
                marginTop: 12,
                border: '1px solid rgba(17, 17, 26, 0.08)',
                borderRadius: 18,
                padding: 14,
                background: 'rgba(255,255,255,0.92)'
              }}
            >
              <div style={{ fontWeight: 980, fontSize: 14, marginBottom: 10 }}>Explain this note</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="ds-pillBtn"
                  type="button"
                  onClick={async () => {
                    setExplainLoading(true);
                    try {
                      const out = await api.aiExplain({ text: previewNote.content, mode: 'more' });
                      setExplainText(out.response || '');
                    } finally {
                      setExplainLoading(false);
                    }
                  }}
                >
                  Explain more
                </button>
                <button
                  className="ds-pillBtn"
                  type="button"
                  onClick={async () => {
                    setExplainLoading(true);
                    try {
                      const out = await api.aiExplain({ text: previewNote.content, mode: 'simpler' });
                      setExplainText(out.response || '');
                    } finally {
                      setExplainLoading(false);
                    }
                  }}
                >
                  Explain simpler
                </button>
                <button
                  className="ds-pillBtn"
                  type="button"
                  onClick={async () => {
                    setExplainLoading(true);
                    try {
                      const out = await api.aiExplain({ text: previewNote.content, mode: 'example' });
                      setExplainText(out.response || '');
                    } finally {
                      setExplainLoading(false);
                    }
                  }}
                >
                  Give example
                </button>
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <input
                  className="ds-input"
                  style={{ flex: 1 }}
                  value={customExplainPrompt}
                  onChange={(e) => setCustomExplainPrompt(e.target.value)}
                  placeholder="Custom instruction (e.g., explain as if I am new to this)"
                />
                <button
                  className="ds-pillBtn"
                  type="button"
                  onClick={async () => {
                    setExplainLoading(true);
                    try {
                      const out = await api.aiExplain({
                        text: previewNote.content,
                        mode: 'custom',
                        customPrompt: customExplainPrompt
                      });
                      setExplainText(out.response || '');
                    } finally {
                      setExplainLoading(false);
                    }
                  }}
                >
                  Custom
                </button>
              </div>

              {explainLoading ? (
                <div style={{ marginTop: 10, fontWeight: 900, fontSize: 13, opacity: 0.7 }}>
                  AI is thinking...
                </div>
              ) : null}

              {explainText ? (
                <div
                  style={{
                    marginTop: 10,
                    whiteSpace: 'pre-wrap',
                    fontWeight: 850,
                    opacity: 0.8,
                    lineHeight: 1.5,
                    fontSize: 13,
                    border: '1px solid rgba(17, 17, 26, 0.06)',
                    borderRadius: 14,
                    padding: 10,
                    background: 'rgba(250,250,255,0.7)'
                  }}
                >
                  {explainText}
                </div>
              ) : null}
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

