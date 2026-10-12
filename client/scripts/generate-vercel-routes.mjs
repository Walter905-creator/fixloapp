import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TREND_TYPES } from '../src/data/trends.js';
import { COMPETITORS } from '../src/data/competitors.js';

const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(clientDir, 'src/App.jsx'), 'utf8');
const routePaths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(match => match[1]);
// A blanket SPA fallback gives nonexistent URLs HTTP 200. Rewrite only app
// routes; Vercel serves generated SEO pages/assets from the filesystem first.
const trends = Object.values(TREND_TYPES).map(trend => trend.slug).join('|');
const competitors = Object.values(COMPETITORS).map(competitor => competitor.slug).join('|');
function sourceFor(route) {
  if (route === '*' || route === '/') return null;
  if (route === '/:trend/:service') return `/:trend(${trends})/:service`;
  if (route === '/:competitor-alternatives') return `/:competitor(${competitors})-alternatives`;
  if (route === '/:competitor-competitors') return `/:competitor(${competitors})-competitors`;
  return route.replace(':country/', ':country(us|ca|uk|au|ar)/')
    .replace(':competitor', `:competitor(${competitors})`)
    .replace('/*', '/:path*');
}
const sources = [...new Set(routePaths.map(sourceFor).filter(Boolean))];
for (const name of ['vercel.json', '../vercel.json']) {
  const file = path.join(clientDir, name);
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const apiRewrites = (config.rewrites || []).filter(rule => rule.source.startsWith('/api/'));
  config.rewrites = [...apiRewrites, ...sources.map(source => ({ source, destination: '/index.html' }))];
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
console.log(`[routing] Generated ${sources.length} explicit SPA rewrites; unknown URLs return 404`);
