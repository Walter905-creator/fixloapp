/**
 * FGE Growth Dashboard — top-level KPI overview.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';
import { Link } from 'react-router-dom';

function StatCard({ label, value, icon, color = 'blue', sub }) {
  const colorMap = {
    blue:   'bg-blue-900/40 border-blue-700 text-blue-300',
    green:  'bg-green-900/40 border-green-700 text-green-300',
    purple: 'bg-purple-900/40 border-purple-700 text-purple-300',
    yellow: 'bg-yellow-900/40 border-yellow-700 text-yellow-300',
    red:    'bg-red-900/40 border-red-700 text-red-300',
  };
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-400 uppercase tracking-widest">30d</span>
      </div>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

export default function GrowthDashboard() {
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fgeApi.getGrowthSummary(), fgeApi.getGrowthHealth()])
      .then(([s, h]) => {
        setSummary(s.summary);
        setHealth(h.health);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => (n ?? 0).toLocaleString();
  const usd = (cents) => '$' + ((cents ?? 0) / 100).toFixed(2);

  return (
    <FGELayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Growth Dashboard</h2>
        <p className="text-gray-400 mt-1">30-day KPI overview for Fixlo Growth Engine</p>
      </div>

      {loading && <p className="text-gray-400">Loading…</p>}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-4 mb-6">
          {error}
          {error.includes('not enabled') && (
            <p className="mt-2 text-xs">Set <code>FGE_ENABLED=true</code> in the server environment to activate the Growth Engine.</p>
          )}
        </div>
      )}

      {summary && (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            <StatCard label="Visitors" value={fmt(summary.visitors)} icon="👥" color="blue" />
            <StatCard label="Revenue" value={usd(summary.revenue)} icon="💰" color="green" />
            <StatCard label="Conversions" value={fmt(summary.conversions)} icon="🎯" color="purple" />
            <StatCard label="New Users" value={fmt(summary.newUsers)} icon="🆕" color="yellow" />
            <StatCard label="GSC Impressions" value={fmt(summary.gscImpressions)} icon="🔍" color="blue" />
            <StatCard label="GSC Clicks" value={fmt(summary.gscClicks)} icon="🖱️" color="blue" />
            <StatCard label="Landing Pages" value={fmt(summary.publishedLandingPages)} icon="📄" color="green" />
            <StatCard label="Blog Posts" value={fmt(summary.publishedBlogPosts)} icon="✍️" color="purple" />
          </div>

          {/* AI Insight */}
          {summary.latestInsight && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💡</span>
                <h3 className="font-semibold text-white">Latest AI Insight</h3>
                {summary.latestInsightDate && (
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(summary.latestInsightDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{summary.latestInsight}</p>
              <Link
                to="/dashboard/admin/fge/insights"
                className="mt-3 inline-block text-xs text-blue-400 hover:underline"
              >
                View full report →
              </Link>
            </div>
          )}

          {/* Campaign status */}
          {summary.campaigns && Object.keys(summary.campaigns).length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-white mb-3">Campaign Status</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(summary.campaigns).map(([status, count]) => (
                  <span key={status} className="bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-200">
                    {status}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Health */}
      {health && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Website Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{health.landingPages?.total ?? 0}</p>
              <p className="text-gray-400 text-xs">Published Pages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{health.landingPages?.pendingIndexing ?? 0}</p>
              <p className="text-gray-400 text-xs">Pending Indexing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-300">{health.blogs?.drafts ?? 0}</p>
              <p className="text-gray-400 text-xs">Blog Drafts</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${health.queue?.failedJobs > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {health.queue?.failedJobs ?? 0}
              </p>
              <p className="text-gray-400 text-xs">Failed Jobs</p>
            </div>
          </div>
        </div>
      )}
    </FGELayout>
  );
}
