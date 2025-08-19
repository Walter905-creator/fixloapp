// client/middleware.js
import { NextResponse } from 'next/server';

// If you don't need to modify requests, you can just passthrough.
// Keep any existing logic you actually use, but DO NOT handle static files here.
export function middleware(req) {
  return NextResponse.next();
}

/**
 * IMPORTANT: Limit middleware to "pages" only.
 * Exclude static assets and known files so we never intercept JS/CSS/images.
 *
 * This negative lookahead excludes:
 *  - static assets (/static, /assets)
 *  - common public files (robots.txt, sitemap.xml, manifest, favicon)
 *  - any path ending with a file extension (".js", ".css", ".png", ".svg", etc.)
 */
export const config = {
  matcher: [
    // Match everything that does NOT look like a file and does not start with these public segments
    '/((?!static|assets|favicon\\.ico|favicon\\.png|robots\\.txt|manifest\\.webmanifest|sitemap\\.xml|cover\\.png|cover\\.jpg|health\\.txt|.*\\.[\\w]+).*)',
  ],
};