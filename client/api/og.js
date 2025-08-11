
export const config = { runtime: 'edge' };

const API_BASE = process.env.REACT_APP_API_URL || 'https://fixloapp.onrender.com';

const fetchPro = async (slug) => {
  try {
    const res = await fetch(`${API_BASE}/api/profiles/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch pro:', error);
    return null;
  }

/* eslint-disable */
export const config = { runtime: 'edge' };
import { ImageResponse } from '@vercel/og';

const API = process.env.API_BASE_URL || 'https://fixloapp.onrender.com';

const fetchPro = async (slug) => {
  try {
    const res = await fetch(`${API}/api/profiles/slug/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
 main
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || '';
 copilot/fix-9bb7feb3-d9a9-4802-a20e-6880a22949f2
    
    const pro = slug ? await fetchPro(slug) : null;

    const name = pro?.businessName || 
                [pro?.firstName, pro?.lastName].filter(Boolean).join(' ') || 
                pro?.name || 
                'Fixlo Professional';
    
    const service = pro?.primaryService || pro?.trade || '';
    const location = [pro?.city, pro?.state].filter(Boolean).join(', ') || '';
    const rating = pro?.avgRating ? `${pro.avgRating.toFixed(1)} ★` : 'New on Fixlo';
    const badges = (pro?.badges || []).map(b => b.name);
    const isBosted = pro?.boostActiveUntil && new Date(pro.boostActiveUntil) > new Date();

    // Simple SVG-based OG image since we don't have @vercel/og
    const ogImageSvg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0B0B0C;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Header -->
        <rect x="0" y="0" width="1200" height="80" fill="url(#accent)"/>
        
        <!-- Fixlo Logo Area -->
        <circle cx="80" cy="40" r="24" fill="white"/>
        <text x="120" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">Fixlo</text>
        <text x="200" y="50" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.8)">• Book trusted pros</text>
        
        <!-- Main Content -->
        <text x="60" y="180" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">${name}</text>
        
        <text x="60" y="240" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.9)">
          ${service}${service && location ? ' • ' : ''}${location}
        </text>
        
        <text x="60" y="290" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)">
          ${rating}
        </text>
        
        ${isBosted ? `
          <rect x="60" y="320" width="120" height="32" rx="16" fill="rgba(99, 102, 241, 0.2)" stroke="rgb(99, 102, 241)"/>
          <text x="75" y="340" font-family="Arial, sans-serif" font-size="14" fill="rgb(99, 102, 241)">🚀 Boosted</text>
        ` : ''}
        
        ${badges.length > 0 ? badges.map((badge, i) => `
          <rect x="${60 + i * 140}" y="${isBosted ? 370 : 340}" width="130" height="28" rx="14" fill="rgba(16, 185, 129, 0.2)" stroke="rgb(16, 185, 129)"/>
          <text x="${75 + i * 140}" y="${isBosted ? 388 : 358}" font-family="Arial, sans-serif" font-size="12" fill="rgb(16, 185, 129)">${badge}</text>
        `).join('') : ''}
        
        <!-- Portfolio Preview -->
        <rect x="700" y="180" width="420" height="280" rx="20" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)"/>
        <text x="910" y="340" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="rgba(255,255,255,0.8)" text-anchor="middle">
          Portfolio Preview
        </text>
        
        <!-- Footer -->
        <text x="60" y="580" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.7)">
          fixloapp.com
        </text>
        <text x="1140" y="580" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.6)" text-anchor="end">
          Professional Services Platform
        </text>
      </svg>
    `;

    return new Response(ogImageSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

  } catch (error) {
    console.error('OG image generation error:', error);
    
    // Fallback OG image
    const fallbackSvg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#0B0B0C"/>
        <circle cx="600" cy="250" r="40" fill="#10b981"/>
        <text x="600" y="340" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
          Fixlo
        </text>
        <text x="600" y="380" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle">
          Professional Services Platform
        </text>
      </svg>
    `;

    return new Response(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

    const pro = slug ? await fetchPro(slug) : null;

    const name = pro?.businessName || [pro?.firstName, pro?.lastName].filter(Boolean).join(' ') || 'Fixlo Pro';
    const service = pro?.primaryService ? `${pro.primaryService}` : '';
    const location = [pro?.city, pro?.state].filter(Boolean).join(', ');
    const rating = pro?.avgRating ? `${pro.avgRating.toFixed(1)} ★` : 'New on Fixlo';
    const badges = (pro?.badges || []).map(b => b.name);

    // Load a font (optional). You can place a TTF in /public/fonts and fetch it here.
    // const fontData = await fetch(new URL('/fonts/Inter-Regular.ttf', req.url)).then(r=>r.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            padding: 48,
            background: '#0B0B0C',
            color: '#fff',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800 }}>
              F
            </div>
            <div style={{ fontSize: 28, opacity: 0.8 }}>Fixlo • Book trusted pros</div>
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 800 }}>{name}</div>
              <div style={{ fontSize: 32, opacity: 0.9 }}>
                {service}{service && location ? ' • ' : ''}{location}
              </div>
              <div style={{ fontSize: 28, marginTop: 8 }}>{rating}</div>
              {!!badges.length && (
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  {badges.map(b => (
                    <div key={b} style={{ fontSize: 22, padding: '6px 12px', borderRadius: 999, background: '#111827', border: '1px solid #1f2937' }}>
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              width: 420, height: 280, borderRadius: 24,
              background: 'linear-gradient(135deg,#1f2937,#0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700
            }}>
              Portfolio Preview
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, opacity: 0.9 }}>
            <div>fixloapp.com</div>
            <div>Share • Book • Review</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        // fonts: [{ name: 'Inter', data: fontData, weight: 400, style: 'normal' }]
      }
    );
  } catch (e) {
    return new Response('OG error', { status: 500 });
 main
  }
}