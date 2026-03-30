import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext.jsx';
import * as api from '../../api/apiClient.js';

import '../../styles/dashboard.css';

export default function DashboardSessions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const settled = await Promise.allSettled([api.getAll('meetings'), api.getAll('groups')]);
      if (!alive) return;
      if (settled[0].status === 'fulfilled') setMeetings(settled[0].value);
      if (settled[1].status === 'fulfilled') setGroups(settled[1].value);
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  const scheduled = useMemo(() => {
    return meetings
      .filter((m) => m.type === 'scheduled')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [meetings]);

  const dropins = useMemo(() => {
    return meetings
      .filter((m) => m.type === 'dropin')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [meetings]);

  return (
    <div className="ds-grid2" aria-label="Dashboard sessions page">
      <section className="ds-card">
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Scheduled Meetings</h3>
            <p className="ds-cardSub ds-cardSubtle">Join group discussions and keep momentum.</p>
          </div>
        </div>

        <div className="ds-meetingsGrid">
          {scheduled.slice(0, 6).map((m) => {
            const g = groupById.get(m.groupId);
            return (
              <div className="ds-meetingCard" key={m.id}>
                <h4 className="ds-meetingTitle">{m.title}</h4>
                <div className="ds-meetingLine">
                  {g ? `${g.courseCode} • ${g.topic}` : 'Group'}
                </div>
                <div className="ds-meetingLine">{new Date(m.scheduledAt).toLocaleString()}</div>
                <div className="ds-meetingLine">Duration: {m.durationMinutes} min</div>
                <button className="ds-primaryBtn" type="button" onClick={() => navigate(`/dashboard/room/${m.id}`)}>
                  Join room
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ds-card">
        <div className="ds-cardHeader">
          <div>
            <h3 className="ds-cardTitle">Drop-in Micro-Sessions</h3>
            <p className="ds-cardSub ds-cardSubtle">15-minute quick doubt clearing sessions.</p>
          </div>
        </div>

        <div className="ds-meetingsGrid">
          {dropins.slice(0, 6).map((m) => {
            const g = groupById.get(m.groupId);
            const isParticipant = m.participants?.includes(user?.id);
            return (
              <div className="ds-meetingCard" key={m.id}>
                <h4 className="ds-meetingTitle">{m.title}</h4>
                <div className="ds-meetingLine">
                  {g ? `${g.courseCode} • ${g.topic}` : 'Group'}
                </div>
                <div className="ds-meetingLine">{new Date(m.scheduledAt).toLocaleString()}</div>
                <div className="ds-meetingLine">
                  Duration: {m.durationMinutes} min {isParticipant ? '• Joined' : ''}
                </div>
                <button className="ds-secondaryBtn" type="button" onClick={() => navigate(`/dashboard/room/${m.id}`)}>
                  Enter drop-in
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

