const https = require('https');

const HOST = process.env.FIXLO_URL || 'https://www.fixloapp.com';
const paths = ['/', '/__health'];

function fetchPath(p) {
  return new Promise((resolve, reject) => {
    https.get(HOST + p, res => {
      const ct = res.headers['content-type'] || '';
      resolve({ path: p, status: res.statusCode, contentType: ct });
    }).on('error', reject);
  });
}

(async () => {
  const results = await Promise.all(paths.map(fetchPath));
  let ok = true;
  for (const r of results) {
    if (r.status !== 200) ok = false;
    if (r.path.endsWith('.js') && !r.contentType.includes('javascript')) ok = false;
  }
  console.log('[Smoke]', results);
  if (!ok) process.exit(1);
})();