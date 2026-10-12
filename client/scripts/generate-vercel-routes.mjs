import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TREND_TYPES } from '../src/data/trends.js';
import { getTransformedRoutes, convertRewrites } from '@vercel/routing-utils';
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
  // Keep redirects, response headers, and API proxy rules when regenerating.
  const transformed = config.routes ? { routes: config.routes } : getTransformedRoutes(config);
  if (transformed.error) throw new Error(JSON.stringify(transformed.error));
  const preserved = transformed.routes.filter(route => route.headers || route.dest?.startsWith('https://'));
  const spaRoutes = convertRewrites(sources.map(source => ({ source, destination: '/index.html' })));
  config.routes = [
    ...preserved,
    { handle: 'filesystem' },
    ...spaRoutes.map(({ check, ...route }) => route),
    { src: '/.*', dest: '/404.html', status: 404 }
  ];
  delete config.rewrites;
  delete config.redirects;
  delete config.headers;
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
console.log(`[routing] Generated ${sources.length} explicit SPA rewrites; unknown URLs return 404`);
