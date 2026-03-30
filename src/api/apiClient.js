const envJsonUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const isDev = import.meta.env.DEV;

/** JSON Server base URL. In production, VITE_API_URL must be set at build time (never localhost). */
export const JSON_API_BASE_URL = isDev
  ? envJsonUrl || 'http://localhost:3001'
  : envJsonUrl;

const SERVER_API_URL = (import.meta.env.VITE_SERVER_API_URL || '/api').replace(/\/+$/, '') || '/api';

/** True when the deployed site will try to call your laptop instead of a real API */
export function isJsonApiMisconfiguredForProduction() {
  if (!import.meta.env.PROD) return false;
  if (!JSON_API_BASE_URL) return true;
  const h = JSON_API_BASE_URL.toLowerCase();
  return h.includes('localhost') || h.includes('127.0.0.1');
}

async function request(path, options = {}) {
  if (!JSON_API_BASE_URL) {
    throw new Error(
      'JSON API is not configured: VITE_API_URL is missing. In Vercel → Settings → Environment Variables, set VITE_API_URL to your hosted JSON Server URL (HTTPS, no trailing slash), then redeploy.'
    );
  }
  if (import.meta.env.PROD) {
    const h = JSON_API_BASE_URL.toLowerCase();
    if (h.includes('localhost') || h.includes('127.0.0.1')) {
      throw new Error(
        'VITE_API_URL points to localhost — valid only on your computer. Set it to your public JSON Server URL on Vercel and rebuild.'
      );
    }
  }

  const res = await fetch(`${JSON_API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getAll(resource) {
  return request(`/${resource}`);
}

export async function getById(resource, id) {
  return request(`/${resource}/${id}`);
}

export async function create(resource, data) {
  return request(`/${resource}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function replace(resource, id, data) {
  return request(`/${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function findBy(resource, query) {
  const qs = new URLSearchParams(query).toString();
  return request(`/${resource}?${qs}`);
}

export async function uploadNoteWithFile(formData) {
  const res = await fetch(`${SERVER_API_URL}/notes/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function aiExplain({ text, mode, customPrompt }) {
  const res = await fetch(`${SERVER_API_URL}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode, customPrompt })
  });
  if (!res.ok) {
    const textErr = await res.text().catch(() => '');
    throw new Error(`AI API error ${res.status}: ${textErr || res.statusText}`);
  }
  return res.json();
}
