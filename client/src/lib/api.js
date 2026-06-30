const API_BASE = import.meta.env.VITE_API_URL || 'https://fixloapp.onrender.com';

function getTokenByRole(role) {
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

export function fetchRecruiterDashboard(options = {}) {
  return requestDashboard('/api/dashboard/recruiter', 'recruiter', options);
}

export function fetchProDashboard(options = {}) {
  return requestDashboard('/api/dashboard/pro', 'pro', options);
}

export function fetchOwnerDashboard(options = {}) {
  return requestDashboard('/api/dashboard/owner', 'recruiter', options);
}

export { API_BASE };
