/* eslint-disable */
export const config = {
  matcher: ['/pro/:path*'] // only run on profile pages
};

const BOT_REGEX = /(facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|TelegramBot|Pinterest|redditbot|vkShare|quora-link-preview)/i;

export default function middleware(req) {
  const ua = req.headers.get('user-agent') || '';
  if (!BOT_REGEX.test(ua)) return; // let SPA handle humans

  const url = new URL(req.url);
  // Extract slug from /pro/<slug>
  const slug = url.pathname.replace(/^\/pro\//, '').replace(/\/+$/, '');
  if (!slug) return;

  url.pathname = '/api/meta';
  url.search = `?slug=${encodeURIComponent(slug)}`;
  return Response.redirect(url, 307);
}