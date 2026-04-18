const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── token storage ─────────────────────────────────────────────────────────────

export const getToken    = () => localStorage.getItem('lyra_token');
export const getUserId   = () => localStorage.getItem('lyra_user_id');
export const setAuth     = (token, userId) => {
  localStorage.setItem('lyra_token', token);
  localStorage.setItem('lyra_user_id', String(userId));
};
export const clearAuth   = () => {
  localStorage.removeItem('lyra_token');
  localStorage.removeItem('lyra_user_id');
};
export const isLoggedIn  = () => !!getToken();

// ── base fetch ────────────────────────────────────────────────────────────────

async function request(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── auth ──────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const data = await request('POST', '/auth/login', { email, password }, false);
  setAuth(data.token, data.user_id);
  return data;
}

export async function register(username, email, password, learningObjectives = []) {
  const data = await request('POST', '/auth/register', {
    username, email, password, learning_objectives: learningObjectives,
  }, false);
  setAuth(data.token, data.user_id);
  return data;
}

// ── exercises ─────────────────────────────────────────────────────────────────

export function nextExercise(userId) {
  return request('GET', `/users/${userId}/next-exercise`);
}

export function getProgress(userId) {
  return request('GET', `/users/${userId}/progress`);
}

export function getExercises() {
  return request('GET', `/exercises`);
}

// ── sessions ──────────────────────────────────────────────────────────────────

export function completeSession(sessionId, metricVector, durationS) {
  return request('POST', `/sessions/${sessionId}/complete`, {
    metric_vector: metricVector,
    duration_s: durationS,
  });
}
