import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext.jsx';
import * as api from '../../api/apiClient.js';

import '../../styles/dashboard.css';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

function PomodoroTimer({ storageKey }) {
  const [minutes, setMinutes] = useState(25);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [group, setGroup] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  const [messages, setMessages] = useState([]);
  const [composer, setComposer] = useState('');

  const roomStorageKey = useMemo(() => `studysmart_room_${meetingId}`, [meetingId]);
  const chatKey = `${roomStorageKey}_chat`;
  const pomodoroKey = `${roomStorageKey}_pomodoro`;
  const boardKey = `${roomStorageKey}_board`;

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
    try {
      const fm = localStorage.getItem('studysmart_focusMode');
      setFocusMode(fm === '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(chatKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    const seeded = [
      {
        id: `seed-${meetingId}-1`,
        userId: group?.members?.[0] || user?.id || 1,
        name: 'StudySmart Bot',
        text: 'Welcome to the room. Start with quick objectives for today!',
        createdAt: new Date().toISOString()
      }
    ];
    setMessages(seeded);
  }, [chatKey, meetingId, group, user]);

  useEffect(() => {
    try {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, chatKey]);

  const headerTitle = meeting ? meeting.title : 'Study Room';

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
            <Whiteboard storageKey={boardKey} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="ds-chatWrap" aria-label="Chat panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontWeight: 980, fontSize: 14 }}>Chat</div>
                  <div style={{ fontWeight: 850, fontSize: 12, opacity: 0.6 }}>
                    {group ? `${group.courseCode} • ${group.topic}` : ''}
                  </div>
                </div>
                <div className="ds-chatList">
                  {messages.map((m) => (
                    <div className="ds-chatMsg" key={m.id}>
                      <div className="ds-chatMsgName">{m.name || 'Student'}</div>
                      <div className="ds-chatMsgText">{m.text}</div>
                    </div>
                  ))}
                </div>
                <div className="ds-chatComposer">
                  <input
                    className="ds-chatInput"
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const text = composer.trim();
                        if (!text) return;
                        const next = {
                          id: `${Date.now()}`,
                          userId: user?.id,
                          name: user?.name || 'Student',
                          text,
                          createdAt: new Date().toISOString()
                        };
                        setMessages((prev) => [...prev, next]);
                        setComposer('');
                      }
                    }}
                  />
                  <button
                    className="ds-chatSend"
                    type="button"
                    onClick={() => {
                      const text = composer.trim();
                      if (!text) return;
                      const next = {
                        id: `${Date.now()}`,
                        userId: user?.id,
                        name: user?.name || 'Student',
                        text,
                        createdAt: new Date().toISOString()
                      };
                      setMessages((prev) => [...prev, next]);
                      setComposer('');
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>

              <PomodoroTimer storageKey={pomodoroKey} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

