/**
 * FGE Analytics Dashboard — traffic, conversions, growth charts.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

function MetricRow({ label, value, color = 'text-white' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700">
      <span className="text-sm text-gray-300">{label}</span>
      <span className={`font-semibold text-sm ${color}`}>{value}</span>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [range, setRange] = useState(null);
  const [topCities, setTopCities] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Date range filter (default: last 30 days)
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [s, r, c, sv] = await Promise.all([
        fgeApi.getAnalyticsSnapshot(),
        fgeApi.getAnalyticsRange({ from, to }),
        fgeApi.getTopCities({ days: 30 }),
        fgeApi.getTopServices({ days: 30 }),
      ]);
      setSnapshot(s.snapshot);
      setRange(r);
      setTopCities(c.cities || []);
      setTopServices(sv.services || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const fmt = (n) => (n ?? 0).toLocaleString();
  const pct = (n) => `${(n ?? 0).toFixed(1)}%`;
  const usd = (cents) => '$' + ((cents ?? 0) / 100).toFixed(2);

  return (
    <FGELayout>
      <h2 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h2>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}

      {/* Date range */}
      <div className="flex items-center gap-3 mb-6">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
        <span className="text-gray-400">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
        <button onClick={loadAll} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg">
          Apply
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading…</p>}

      {/* Today's snapshot */}
      {snapshot ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-4">Today's Snapshot</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Visitors', value: fmt(snapshot.visitors) },
              { label: 'Conversions', value: fmt(snapshot.conversions) },
              { label: 'Revenue', value: usd(snapshot.revenue) },
              { label: 'Bounce Rate', value: pct(snapshot.bounceRate) },
            ].map((m) => (
              <div key={m.label} className="text-center bg-gray-700 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="text-xs text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
            <p className="text-gray-400 text-sm">No analytics data recorded yet. Data is populated by background jobs.</p>
          </div>
        )
      )}

      {/* Range totals */}
      {range && range.totals && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">Range Totals</h3>
            <MetricRow label="Visitors" value={fmt(range.totals.visitors)} />
            <MetricRow label="Conversions" value={fmt(range.totals.conversions)} />
            <MetricRow label="Revenue" value={usd(range.totals.revenue)} color="text-green-400" />
            <MetricRow label="New Users" value={fmt(range.totals.newUsers)} />
            <MetricRow label="GSC Impressions" value={fmt(range.totals.gscImpressions)} />
            <MetricRow label="GSC Clicks" value={fmt(range.totals.gscClicks)} />
          </div>

          {/* Top Cities */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">Top Cities (30d)</h3>
            {topCities.length === 0 ? (
              <p className="text-gray-400 text-sm">No city data yet.</p>
            ) : (
              topCities.slice(0, 8).map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-700 last:border-0">
                  <span className="text-sm text-gray-300">{c.city}, {c.state}</span>
                  <span className="text-sm font-medium text-white">{fmt(c.visits)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Top Services */}
      {topServices.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-3">Top Services (30d)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topServices.slice(0, 8).map((s, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{fmt(s.requests)}</p>
                <p className="text-xs text-gray-400 capitalize">{s.service}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </FGELayout>
  );
}
