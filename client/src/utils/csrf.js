/**
 * CSRF token utility for the Fixlo React frontend.
 *
 * Lazily fetches the CSRF token from GET /api/csrf-token, caches it for the
 * lifetime of the page session, and exposes a csrfFetch() wrapper that
 * automatically includes the token in state-changing requests.
 *
 * Usage:
 *   import { csrfFetch } from '../utils/csrf';
 *
 *   // Anywhere you would use fetch() for a non-JWT POST/PUT/PATCH/DELETE:
 *   const res = await csrfFetch(`${API_BASE}/api/contact`, {
 *     method: 'POST',
 *     body: JSON.stringify(payload),
 *   });
 *
 * Routes that are exempt from CSRF on the server side (public auth endpoints
 * and JWT-bearer-authenticated routes) do not need to use csrfFetch — plain
 * fetch() continues to work for those.
 */

import { API_BASE } from './config';

/** In-memory token cache (cleared on page reload, which triggers a fresh GET). */
let _cachedToken = null;
/** Deduplicate in-flight fetch requests. */
let _inflightPromise = null;

/**
 * Fetch (and cache) the CSRF token from the backend.
 * Subsequent calls within the same page session return the cached value.
 *
 * @returns {Promise<string|null>} The CSRF token, or null on network error.
 */
export async function getCsrfToken() {
  if (_cachedToken) return _cachedToken;

  if (!_inflightPromise) {
    _inflightPromise = fetch(`${API_BASE}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Required: lets the browser send/receive the _csrf cookie
    })
      .then(res => {
        if (!res.ok) throw new Error(`CSRF token fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        _cachedToken = data.csrfToken || null;
        _inflightPromise = null;
        return _cachedToken;
      })
      .catch(err => {
        _inflightPromise = null;
        console.error('[CSRF] Unable to fetch token:', err.message);
        return null;
      });
  }

  return _inflightPromise;
}

/**
 * Invalidate the cached CSRF token.
 * Call this if the server returns a 403 EBADCSRFTOKEN so the next request
 * will re-fetch a fresh token automatically.
 */
export function clearCsrfToken() {
  _cachedToken = null;
}

/**
 * Drop-in replacement for fetch() that automatically:
 *  - adds `credentials: 'include'` (required for the CSRF cookie),
 *  - fetches and attaches the `x-csrf-token` header for state-changing methods
 *    (POST, PUT, PATCH, DELETE).
 *
 * GET / HEAD / OPTIONS are passed through unchanged (no token needed).
 *
 * If the first attempt returns 403 (expired/rotated token), the cache is
 * cleared and the request is retried once with a fresh token.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function csrfFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (safeMethod) {
    return fetch(url, { credentials: 'include', ...options });
  }

  const token = await getCsrfToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['x-csrf-token'] = token;
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  // If the token was rejected (e.g. rotated after a long session), retry once.
  if (res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.error === 'Invalid or missing CSRF token') {
      clearCsrfToken();
      const freshToken = await getCsrfToken();
      if (freshToken) {
        headers['x-csrf-token'] = freshToken;
        return fetch(url, { credentials: 'include', ...options, headers });
      }
    }
  }

  return res;
}
