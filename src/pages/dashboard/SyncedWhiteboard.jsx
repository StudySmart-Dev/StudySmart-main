import React, { useEffect, useMemo, useRef, useState } from 'react';

import * as api from '../../api/apiClient.js';

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export default function SyncedWhiteboard({ meetingId, onStrokeComplete }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);

  // Strokes stored in normalized coordinates (0..1), so they scale across screen sizes.
  const strokesRef = useRef([]);
  const [loaded, setLoaded] = useState(false);

  const color = '#0b0b0f';
  const width = 2.6;

  const storageKey = useMemo(() => `studysmart_board_${meetingId}`, [meetingId]);
  const whiteboardIdRef = useRef(null);
  const lastUpdatedAtRef = useRef(null);

  function resizeCanvasAndGetCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    // Draw using CSS pixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    return ctx;
  }

  function getRect() {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 1, height: 1 };
    const rect = canvas.getBoundingClientRect();
    return { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
  }

  function normPoint(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    return {
      x: (e.clientX - rect.left) / w,
      y: (e.clientY - rect.top) / h
    };
  }

  function denormPoint(p, rect) {
    return { x: p.x * rect.width, y: p.y * rect.height };
  }

  function drawStroke(ctx, stroke, rect) {
    const pts = stroke?.points || [];
    if (!pts.length) return;

    const pxPts = pts.map((p) => denormPoint(p, rect));

    if (pxPts.length === 1) {
      const p0 = pxPts[0];
      ctx.fillStyle = stroke.color;
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;

    ctx.beginPath();
    ctx.moveTo(pxPts[0].x, pxPts[0].y);
    for (let i = 1; i < pxPts.length - 1; i += 1) {
      const curr = pxPts[i];
      const next = pxPts[i + 1];
      const mid = midpoint(curr, next);
      ctx.quadraticCurveTo(curr.x, curr.y, mid.x, mid.y);
    }
    const last = pxPts[pxPts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  function redrawAll() {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rectCss = getRect();
    ctx.clearRect(0, 0, rectCss.width, rectCss.height);
    for (const s of strokesRef.current) drawStroke(ctx, s, rectCss);
  }

  async function fetchRemoteBoard() {
    const res = await api.findBy('whiteboards', { meetingId: Number(meetingId) });
    if (Array.isArray(res) && res.length > 0) return res[0];
    return null;
  }

  async function load() {
    const ctx = resizeCanvasAndGetCtx();
    if (!ctx) return;

    // Local fallback
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) strokesRef.current = parsed;
      }
    } catch {
      // ignore
    }

    const remote = await fetchRemoteBoard().catch(() => null);
    if (remote) {
      whiteboardIdRef.current = remote.id;
      lastUpdatedAtRef.current = remote.updatedAt || null;
      strokesRef.current = Array.isArray(remote.strokes) ? remote.strokes : [];
    }

    redrawAll();
    setLoaded(true);

    // If server is empty but we have local strokes, push them once.
    if (!remote && strokesRef.current.length > 0) {
      await save();
    }
  }

  async function save() {
    const updatedAt = new Date().toISOString();
    const payload = {
      meetingId: Number(meetingId),
      strokes: strokesRef.current,
      updatedAt
    };

    if (whiteboardIdRef.current) {
      await api.replace('whiteboards', whiteboardIdRef.current, payload);
    } else {
      const created = await api.create('whiteboards', payload);
      whiteboardIdRef.current = created.id;
    }

    lastUpdatedAtRef.current = updatedAt;
    try {
      localStorage.setItem(storageKey, JSON.stringify(strokesRef.current));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } catch {
        // ignore, keep local fallback
      }
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  useEffect(() => {
    function onResize() {
      resizeCanvasAndGetCtx();
      redrawAll();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (!loaded) return;
      if (drawingRef.current) return;

      const remote = await fetchRemoteBoard().catch(() => null);
      if (!remote) return;

      const remoteUpdatedAt = remote.updatedAt || null;
      if (remoteUpdatedAt && remoteUpdatedAt === lastUpdatedAtRef.current) return;

      whiteboardIdRef.current = remote.id;
      lastUpdatedAtRef.current = remoteUpdatedAt;
      strokesRef.current = Array.isArray(remote.strokes) ? remote.strokes : [];
      redrawAll();
    }, 2500);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, meetingId]);

  return (
    <div className="ds-roomCanvasWrap" aria-label="Shared whiteboard">
      <div className="ds-roomCanvasTop">
        <h3>Whiteboard</h3>
        <button
          className="ds-pillBtn"
          type="button"
          onClick={async () => {
            strokesRef.current = [];
            redrawAll();
            try {
              await save();
            } catch {
              // ignore
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
          const p = normPoint(e);
          const next = { color, width, points: [p] };
          currentStrokeRef.current = next;

          const rectCss = getRect();
          const px = denormPoint(p, rectCss);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px.x, px.y, width / 2, 0, Math.PI * 2);
          ctx.fill();
        }}
        onPointerMove={(e) => {
          if (!drawingRef.current) return;
          const ctx = ctxRef.current;
          if (!ctx) return;

          const stroke = currentStrokeRef.current;
          if (!stroke) return;

          const p = normPoint(e);
          stroke.points.push(p);

          const pts = stroke.points;
          if (pts.length < 2) return;

          const rectCss = getRect();
          const prev = pts[pts.length - 2];
          const curr = pts[pts.length - 1];
          const mid = midpoint(prev, curr);

          const prevPx = denormPoint(prev, rectCss);
          const midPx = denormPoint(mid, rectCss);

          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(prevPx.x, prevPx.y);
          ctx.quadraticCurveTo(prevPx.x, prevPx.y, midPx.x, midPx.y);
          ctx.stroke();
        }}
        onPointerUp={async () => {
          if (!drawingRef.current) return;
          drawingRef.current = false;

          const stroke = currentStrokeRef.current;
          currentStrokeRef.current = null;
          if (!stroke || !stroke.points || stroke.points.length < 1) return;

          strokesRef.current = [...strokesRef.current, stroke];
          redrawAll();

          try {
            await save();
          } catch {
            // ignore
          }

          try {
            await onStrokeComplete?.(stroke);
          } catch {
            // ignore
          }
        }}
        onPointerLeave={() => {
          drawingRef.current = false;
          currentStrokeRef.current = null;
        }}
      />
    </div>
  );
}

