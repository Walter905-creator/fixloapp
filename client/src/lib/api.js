const API = (path) => `/api${path}`; // vercel.json proxies /api -> backend

export async function postJSON(url, data) {
  const r = await fetch(API(url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getJSON(url, token) {
  const r = await fetch(API(url), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: 'include'
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}