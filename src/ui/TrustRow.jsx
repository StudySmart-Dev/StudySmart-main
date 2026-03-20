import React from 'react';

function Avatar({ colorA, colorB }) {
  return (
    <span
      className="ls-avatar"
      style={{
        background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
      }}
      aria-hidden="true"
    />
  );
}

export default function TrustRow() {
  return (
    <div className="ls-trustRow" role="note" aria-label="Trusted by millions of people">
      <div className="ls-avatarsWrap" aria-hidden="true">
        <Avatar colorA="#6aa7ff" colorB="#3e54ff" />
        <Avatar colorA="#ff9c7a" colorB="#ff6bcb" />
        <Avatar colorA="#7dd3fc" colorB="#2dd4bf" />
      </div>

      <div className="ls-trustText">
        Trusted by millions of people
        <br />
        try now.
      </div>
    </div>
  );
}

