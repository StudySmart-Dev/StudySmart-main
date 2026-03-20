import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext.jsx';
import * as api from '../../api/apiClient.js';
import {
  awardForBoardStroke,
  awardForChatMessage,
  awardForPomodoroComplete,
  awardForRoomJoin,
  normalizeUser
} from '../../achievements/achievementEngine.js';

import SyncedWhiteboard from './SyncedWhiteboard.jsx';

import '../../styles/dashboard.css';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

function PomodoroTimer({ storageKey, onComplete }) {
  const [minutes, setMinutes] = useState(25);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const completedRef = useRef(false);

  // Load persisted state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.minutes === 'number') setMinutes(parsed.minutes);
      if (typeof parsed?.secondsLeft === 'number') setSecondsLeft(parsed.secondsLeft);
      if (typeof parsed?.running === 'boolean') setRunning(parsed.running);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ minutes, secondsLeft, running }));
    } catch {
      // ignore
    }
  }, [minutes, secondsLeft, running, storageKey]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft === 0) setRunning(false);
  }, [secondsLeft, running]);

  useEffect(() => {
    if (!running && secondsLeft === 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running]);

  return (
    <div className="ds-timerWrap" aria-label="Pomodoro timer">
      <div className="ds-timerTop">
        <h3>Pomodoro</h3>
        <div className="ds-timerTime">{formatTime(secondsLeft)}</div>
      </div>
      <div className="ds-timerControls">
        <button
          className="ds-smallBtn"
          type="button"
          onClick={() => {
            setRunning(false);
            completedRef.current = false;
            setMinutes(15);
            setSecondsLeft(15 * 60);
          }}
        >
          15 min
        </button>
        <button
          className="ds-smallBtn"
          type="button"
          onClick={() => {
            setRunning(false);
            completedRef.current = false;
            setMinutes(25);
            setSecondsLeft(25 * 60);
          }}
        >
          25 min
        </button>
      </div>
      <div className="ds-timerControls">
        <button
          className="ds-primaryBtn"
          type="button"
          onClick={() => {
            if (secondsLeft === 0) {
              setSecondsLeft(minutes * 60);
            }
            completedRef.current = false;
            setRunning((v) => !v);
          }}
        >
          {running ? 'Pause' : 'Start'}
        </button>
      </div>
      <button
        className="ds-secondaryBtn"
        type="button"
        onClick={() => {
          setRunning(false);
          completedRef.current = false;
          setSecondsLeft(minutes * 60);
        }}
      >
        Reset
      </button>
    </div>
  );
}

function Whiteboard({ storageKey }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);

  // Store strokes in a ref to avoid re-rendering on every pointer move.
  const strokesRef = useRef([]);
  const [loaded, setLoaded] = useState(false);

  const color = '#0b0b0f';
  const width = 2.6;
  const lastPointRef = useRef(null);

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function resizeCanvasAndGetCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    // Reset transform after resizing.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    return ctx;
  }

  function drawStroke(ctx, stroke) {
    if (!stroke?.points?.length) return;
    const pts = stroke.points;
    if (pts.length === 1) {
      ctx.fillStyle = stroke.color;
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;

    // Quadratic smoothing: draw segments to midpoints.
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i += 1) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const mid = midpoint(curr, pts[i + 1]);
      ctx.quadraticCurveTo(curr.x, curr.y, mid.x, mid.y);
      // prev/ curr variables are unused beyond readability; keep loop stable.
      void prev;
    }
    // Final segment to last point.
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  function redrawAll() {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const s of strokesRef.current) drawStroke(ctx, s);
  }

  function persist(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  // Load persisted strokes once.
  useEffect(() => {
    const ctx = resizeCanvasAndGetCtx();
    if (!ctx) return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) strokesRef.current = parsed;
      }
    } catch {
      // ignore
    }

    redrawAll();
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function getPoint(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // Handle canvas resize (basic).
  useEffect(() => {
    function onResize() {
      if (!canvasRef.current) return;
      resizeCanvasAndGetCtx();
      redrawAll();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ds-roomCanvasWrap" aria-label="Shared whiteboard">
      <div className="ds-roomCanvasTop">
        <h3>Whiteboard</h3>
        <button
          className="ds-pillBtn"
          type="button"
          onClick={() => {
            strokesRef.current = [];
            persist([]);

            const ctx = ctxRef.current;
            const canvas = canvasRef.current;
            if (ctx && canvas) {
              const rect = canvas.getBoundingClientRect();
              ctx.clearRect(0, 0, rect.width, rect.height);
            }
          }}
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="ds-canvas"
        onPointerDown={(e) => {
          if (!loaded) return;
          const ctx = ctxRef.current;
          if (!ctx) return;

          drawingRef.current = true;
          const p = getPoint(e);
          lastPointRef.current = p;
          const next = { color, width, points: [p] };
          currentStrokeRef.current = next;

          // Draw a dot for immediate feedback.
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, width / 2, 0, Math.PI * 2);
          ctx.fill();
        }}
        onPointerMove={(e) => {
          if (!drawingRef.current) return;
          const ctx = ctxRef.current;
          if (!ctx) return;

          const p = getPoint(e);
          const stroke = currentStrokeRef.current;
          if (!stroke) return;

          stroke.points.push(p);

          const pts = stroke.points;
          if (pts.length < 2) return;

          // Incremental quadratic segment for smoother strokes.
          const prev = pts[pts.length - 2];
          const curr = pts[pts.length - 1];
          const mid = midpoint(prev, curr);

          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          if (!drawingRef.current) return;
          drawingRef.current = false;

          const stroke = currentStrokeRef.current;
          currentStrokeRef.current = null;
          lastPointRef.current = null;

          if (!stroke || !stroke.points || stroke.points.length < 1) return;

          strokesRef.current = [...strokesRef.current, stroke];
          persist(strokesRef.current);
          redrawAll();
        }}
        onPointerLeave={() => {
          drawingRef.current = false;
          currentStrokeRef.current = null;
          lastPointRef.current = null;
        }}
      />
    </div>
  );
}

export default function StudyRoom() {
  const { meetingId } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [group, setGroup] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [lowBandwidth, setLowBandwidth] = useState(false);

  const [messages, setMessages] = useState([]);
  const [composer, setComposer] = useState('');

  const pomodoroKey = useMemo(() => `studysmart_room_${meetingId}_pomodoro`, [meetingId]);

  const [roomToast, setRoomToast] = useState('');

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
    if (!roomToast) return;
    const t = window.setTimeout(() => setRoomToast(''), 2500);
    return () => window.clearTimeout(t);
  }, [roomToast]);

  async function persistUser(nextUser, earned) {
    const saved = await api.replace('users', nextUser.id, nextUser);
    updateUser(saved);
    if (earned?.xpDelta) setRoomToast(`+${earned.xpDelta} XP`);
    if (earned?.badges && earned.badges.length) setRoomToast(`Badge earned: ${earned.badges[0]}`);
  }

  async function award({ type, payload } = {}) {
    if (!user?.id) return;
    const normalized = normalizeUser(user);
    let result = null;
    if (type === 'roomJoin') result = awardForRoomJoin({ user: normalized, xp: payload?.xp || 8 });
    if (type === 'chatMessage') result = awardForChatMessage({ user: normalized, xp: payload?.xp || 1 });
    if (type === 'boardStroke') result = awardForBoardStroke({ user: normalized, xp: payload?.xp || 2 });
    if (type === 'pomodoro') result = awardForPomodoroComplete({ user: normalized, xp: payload?.xp || 3 });
    if (!result) return;
    await persistUser(result.user, result.earned);
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      const m = await api.getById('meetings', meetingId);
      if (!alive) return;
      setMeeting(m);
      const g = await api.getById('groups', m.groupId);
      setGroup(g);
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, [meetingId]);

  useEffect(() => {
    if (!user || !meeting) return;
    const key = `studysmart_joined_${meetingId}_${user.id}`;
    try {
      if (localStorage.getItem(key) === '1') return;
      localStorage.setItem(key, '1');
    } catch {
      // ignore
    }
    award({ type: 'roomJoin', payload: { xp: 8 } }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, meeting, user]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await api.findBy('meetingMessages', { meetingId: Number(meetingId) });
      if (!alive) return;
      const list = Array.isArray(res) ? res : [];
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(list);
    }

    load().catch(() => {});
    const interval = window.setInterval(() => {
      load().catch(() => {});
    }, 2500);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [meetingId]);

  const headerTitle = meeting ? meeting.title : 'Study Room';

  async function sendMessage() {
    if (!user?.id) return;
    const text = composer.trim();
    if (!text) return;

    const payload = {
      meetingId: Number(meetingId),
      userId: user.id,
      name: user.name,
      text,
      createdAt: new Date().toISOString()
    };

    const created = await api.create('meetingMessages', payload);
    setMessages((prev) => {
      if (prev.some((m) => String(m.id) === String(created.id))) return prev;
      return [...prev, created];
    });
    setComposer('');
    await award({ type: 'chatMessage', payload: { xp: 1 } });
  }

  async function handleBoardStrokeComplete() {
    await award({ type: 'boardStroke', payload: { xp: 2 } });
  }

  async function handlePomodoroComplete() {
    await award({ type: 'pomodoro', payload: { xp: 3 } });
  }

  return (
    <div className={`ds-shell ${focusMode ? 'ds-focusMode' : ''}`}>
      <div className="ds-container" style={{ paddingTop: 10 }}>
        <div className="ds-contentWrap" style={{ width: '100%' }}>
          <header className="ds-topbar" style={{ paddingBottom: 12 }}>
            <h2 className="ds-topTitle">{headerTitle}</h2>
            <div className="ds-topRight">
              <button
                className="ds-logoutBtn"
                type="button"
                onClick={() => navigate('/dashboard')}
              >
                Back to dashboard
              </button>
            </div>
          </header>

          <div className="ds-roomsGrid">
            {lowBandwidth ? (
              <div className="ds-roomCanvasWrap" aria-label="Whiteboard hidden in low bandwidth mode">
                <div className="ds-roomCanvasTop">
                  <h3>Whiteboard</h3>
                </div>
                <div style={{ padding: 14, fontWeight: 850, opacity: 0.65, fontSize: 13 }}>
                  Low-Bandwidth mode is enabled. Whiteboard is hidden to save data.
                </div>
              </div>
            ) : (
              <SyncedWhiteboard meetingId={meetingId} onStrokeComplete={handleBoardStrokeComplete} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="ds-chatWrap" aria-label="Chat panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontWeight: 980, fontSize: 14 }}>Chat</div>
                  <div style={{ fontWeight: 850, fontSize: 12, opacity: 0.6 }}>
                    {group ? `${group.courseCode} • ${group.topic}` : ''}
                  </div>
                </div>
                <div className="ds-chatList">
                  {(focusMode ? messages.slice(-6) : lowBandwidth ? messages.slice(-14) : messages).map((m) => (
                    <div className="ds-chatMsg" key={m.id}>
                      <div className="ds-chatMsgName">{m.name || 'Student'}</div>
                      <div className="ds-chatMsgText">{m.text}</div>
                    </div>
                  ))}
                </div>

                {focusMode ? (
                  <div style={{ padding: '10px 4px', fontWeight: 850, opacity: 0.65, fontSize: 13 }}>
                    Focus Mode is on: chat composer is minimized during active study.
                  </div>
                ) : (
                  <div className="ds-chatComposer">
                    <input
                      className="ds-chatInput"
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendMessage().catch(() => {});
                        }
                      }}
                    />
                    <button className="ds-chatSend" type="button" onClick={() => sendMessage().catch(() => {})}>
                      Send
                    </button>
                  </div>
                )}
              </div>

              <PomodoroTimer storageKey={pomodoroKey} onComplete={handlePomodoroComplete} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

