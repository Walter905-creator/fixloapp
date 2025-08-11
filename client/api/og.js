
import { ImageResponse } from '@vercel/og';

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
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || '';
    
    const pro = slug ? await fetchPro(slug) : null;

    const name = pro?.businessName || 
                [pro?.firstName, pro?.lastName].filter(Boolean).join(' ') || 
                pro?.name || 
                'Fixlo Professional';
    
    const service = pro?.primaryService || pro?.trade || '';
    const location = [pro?.city, pro?.state].filter(Boolean).join(', ') || '';
    const rating = pro?.avgRating ? `${pro.avgRating.toFixed(1)} ★` : 'New on Fixlo';
    const badges = (pro?.badges || []).map(b => b.name);
    const isBoosted = pro?.boostActiveUntil && new Date(pro.boostActiveUntil) > new Date();

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
              {isBoosted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 22, padding: '6px 12px', borderRadius: 999, background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgb(99, 102, 241)', color: 'rgb(99, 102, 241)' }}>
                    🚀 Boosted
                  </div>
                </div>
              )}
              {!!badges.length && (
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  {badges.slice(0, 3).map(b => (
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
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    
    // Fallback OG image
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0B0B0C',
            color: '#fff',
          }}
        >
          <div style={{ width: 80, height: 80, borderRadius: 40, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800, marginBottom: 24 }}>
            F
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, marginBottom: 16 }}>Fixlo</div>
          <div style={{ fontSize: 32, opacity: 0.8 }}>Professional Services Platform</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}