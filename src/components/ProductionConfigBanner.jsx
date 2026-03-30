import React, { useState } from 'react';

import { isJsonApiMisconfiguredForProduction } from '../api/apiClient.js';

export default function ProductionConfigBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !isJsonApiMisconfiguredForProduction()) return null;

  return (
    <div
      role="alert"
      style={{
        background: 'linear-gradient(90deg, #fef3c7, #fde68a)',
        borderBottom: '1px solid #d97706',
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 800,
        color: '#78350f',
        lineHeight: 1.45
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ flex: '1 1 280px' }}>
          Production needs a public JSON Server URL. Set <code style={{ background: 'rgba(255,255,255,0.7)', padding: '1px 6px', borderRadius: 6 }}>VITE_API_URL</code> and{' '}
          <code style={{ background: 'rgba(255,255,255,0.7)', padding: '1px 6px', borderRadius: 6 }}>JSON_SERVER_URL</code> in Vercel → Environment Variables (same HTTPS base, no trailing slash), then{' '}
          <strong>redeploy</strong>. See README → Deployment.
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            border: '1px solid #b45309',
            background: '#fff',
            borderRadius: 10,
            padding: '6px 12px',
            fontWeight: 900,
            cursor: 'pointer',
            color: '#78350f'
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
