function handler(req, res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, follow');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Page not found | Fixlo</title></head><body style="font:18px system-ui,sans-serif;text-align:center;padding:64px 24px;color:#0f172a;background:#f8fafc"><main><p>404</p><h1>Page not found</h1><p>This page may have moved or is no longer available.</p><a href="/">Go to Fixlo</a></main></body></html>');
}
module.exports = handler;
