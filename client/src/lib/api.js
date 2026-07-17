const API_BASE = import.meta.env.VITE_API_URL || 'https://fixloapp.onrender.com';

// Re-export CSRF fetch helper so callers can import from one place.
// Use csrfFetch() for any public (non-JWT) state-changing requests such as
// contact forms, homeowner-lead, service-request, etc.
export { csrfFetch, getCsrfToken, clearCsrfToken } from '../utils/csrf';

function getTokenByRole(role) {
  if (role === 'homeowner') {
    return localStorage.getItem('fixlo_homeowner_token') || localStorage.getItem('fixlo_token') || '';
  }
  if (role === 'recruiter') {
    return localStorage.getItem('fixlo_recruiter_token') || '';
  }
  return localStorage.getItem('fixlo_token') || '';
}

function buildUrl(path, userId) {
  if (!userId) return `${API_BASE}${path}`;
  const q = new URLSearchParams({ userId });
  return `${API_BASE}${path}?${q.toString()}`;
}

async function requestDashboard(path, role, options = {}) {
  const token = getTokenByRole(role);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const response = await fetch(buildUrl(path, options.userId), {
    method: 'GET',
    credentials: 'include',
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to load dashboard');
  }

  return response.json();
}

async function requestJson(path, role, options = {}) {
  const token = getTokenByRole(role);
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const response = await fetch(buildUrl(path, options.userId), {
    method: options.method || 'GET',
    credentials: 'include',
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}

export function fetchRecruiterDashboard(options = {}) {
  return requestDashboard('/api/dashboard/recruiter', 'recruiter', options);
}

export function fetchProDashboard(options = {}) {
  return requestDashboard('/api/dashboard/pro', 'pro', options);
}

export function fetchHomeownerDashboard(options = {}) {
  return requestDashboard('/api/dashboard/homeowner', 'homeowner', options);
}

export function fetchOwnerDashboard(options = {}) {
  return requestDashboard('/api/dashboard/owner', 'recruiter', options);
}

export function fetchNotifications(role, options = {}) {
  return requestJson('/api/notifications', role, { method: 'GET', ...options });
}

export function fetchAppointments(role, options = {}) {
  return requestJson('/api/calendar/appointments', role, { method: 'GET', ...options });
}

export function fetchDocuments(role, options = {}) {
  return requestJson('/api/documents', role, { method: 'GET', ...options });
}

export function fetchConversations(role, options = {}) {
  return requestJson('/api/conversations', role, { method: 'GET', ...options });
}

export function sendMessage(role, data = {}) {
  const path = data.conversationId && data.text ? '/api/messages' : '/api/conversations';
  return requestJson(path, role, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export { API_BASE };
