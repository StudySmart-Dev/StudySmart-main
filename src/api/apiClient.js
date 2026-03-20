const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SERVER_API_URL = import.meta.env.VITE_SERVER_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
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
