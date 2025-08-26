const BASE = process.env.REACT_APP_API_BASE || process.env.VITE_API_BASE || "";

// Safe fetch that doesn't crash when backend returns HTML (e.g., due to rewrite)
export async function api(path, options = {}) {
  const url = (BASE ? BASE.replace(/\/$/, "") : "") + path;
  const res = await fetch(url, { credentials: "include", ...options });
  const ctype = res.headers.get("content-type") || "";
  let body;
  if (ctype.includes("application/json")) {
    body = await res.json();
  } else {
    // Fallback to text for HTML or other types
    const text = await res.text();
    // Surface meaningful error if HTML/doctype is returned
    if (!res.ok || /^\s*<!doctype/i.test(text)) {
      const msg = `Unexpected response (status ${res.status}).`;
      throw new Error(msg);
    }
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!res.ok) {
    const msg = (body && body.error) ? body.error : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}
