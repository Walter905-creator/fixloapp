/* eslint-disable */

const API = process.env.API_BASE_URL || 'https://fixloapp.onrender.com';
const ORIGIN = process.env.PUBLIC_ORIGIN || 'https://www.fixloapp.com';

const escape = (s='') => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || '';
    if (!slug) return new Response('Missing slug', { status: 400 });

    // fetch public pro data
    let pro = null;
    try {
      const res = await fetch(`${API}/api/profiles/slug/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
      if (res.ok) pro = await res.json();
    } catch {}

    const name = pro?.businessName || [pro?.firstName, pro?.lastName].filter(Boolean).join(' ') || 'Fixlo Pro';
    const title = `${name}${pro?.primaryService ? ' — ' + pro.primaryService : ''}${pro?.city ? ' in ' + pro.city : ''}`;
    const desc = `Book ${name} on Fixlo. ${pro?.primaryService || 'Home services'}${pro?.city ? ' • ' + pro.city : ''}${pro?.state ? ', ' + pro.state : ''}. Reviews, photos, and easy booking.`;
    const pageUrl = `${ORIGIN}/pro/${encodeURIComponent(slug)}`;
    const ogImg = `${ORIGIN}/api/og?slug=${encodeURIComponent(slug)}`;

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escape(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escape(desc)}">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(desc)}">
<meta property="og:url" content="${escape(pageUrl)}">
<meta property="og:image" content="${escape(ogImg)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(desc)}">
<meta name="twitter:image" content="${escape(ogImg)}">

<link rel="canonical" href="${escape(pageUrl)}" />
<meta http-equiv="refresh" content="0; url=${escape(pageUrl)}" />
</head>
<body>Redirecting to <a href="${escape(pageUrl)}">${escape(pageUrl)}</a>.</body>
</html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'public, max-age=300' } });
  } catch (e) {
    return new Response('Meta error', { status: 500 });
  }
}