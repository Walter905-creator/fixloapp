import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminSEOAIPage() {
  const [status, setStatus] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    fetchPages();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/seo/status`, { headers: getAuthHeaders() });
      if (res.ok) setStatus(await res.json());
    } catch (err) {
      console.error('Failed to fetch SEO status:', err);
    }
  };

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/seo-ai/pages?limit=10`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch pages');
      const data = await res.json();
      setPages(data.pages || []);
    } catch (err) {
      console.error('Failed to fetch pages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setToggling(true);
      const res = await fetch(`${API_BASE}/api/admin/seo/toggle`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Toggle failed');
      const data = await res.json();
      setStatus(prev => ({ ...prev, enabled: data.enabled }));
    } catch (err) {
      alert('Toggle error: ' + err.message);
    } finally {
      setToggling(false);
    }
  };

  const runNow = async () => {
    try {
      setRunning(true);
      const res = await fetch(`${API_BASE}/api/admin/seo/run-now`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run');
      alert(`SEO AI Engine triggered!\n${data.message || ''}`);
      fetchStatus();
      fetchPages();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <HelmetSEO
        title="SEO AI Engine | Admin | Fixlo"
        canonicalPathname="/dashboard/admin/seo-ai"
        robots="noindex, nofollow"
      />
      <div className="container-xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">🔍 SEO AI Engine</h1>
            <p className="text-sm text-gray-600">Automated SEO content generation and optimization</p>
          </div>
          <a href="/dashboard/admin" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</a>
        </div>

        {/* Status Metrics */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className="text-xl font-bold">
              {status === null ? <span className="text-gray-400">…</span>
                : status.enabled ? <span className="text-green-600">Enabled</span>
                : <span className="text-red-500">Disabled</span>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Today</div>
            <div className="text-xl font-bold text-blue-700">{status?.pagesGeneratedToday ?? '–'}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Total Pages</div>
            <div className="text-xl font-bold">{status?.totalPages ?? '–'}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Indexed</div>
            <div className="text-xl font-bold text-green-700">{status?.indexedPages ?? '–'}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Last Run</div>
            <div className="text-sm font-semibold">
              {status?.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-bold mb-4">Controls</h2>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Auto-generation</span>
              <button
                onClick={handleToggle}
                disabled={toggling || status === null}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${status?.enabled ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${status?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-500">{status?.enabled ? 'ON' : 'OFF'}</span>
            </div>
            {/* Run Now */}
            <button
              onClick={runNow}
              disabled={running}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {running ? 'Running…' : '▶ Run Now'}
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-500">Scheduled to run daily at 3:30 AM automatically when enabled.</p>
        </div>

        {/* Recent Pages */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Recent Generated Pages</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading…</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">Error: {error}</div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No SEO pages generated yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impressions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pages.map((page) => (
                    <tr key={page._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{page.service}</td>
                      <td className="px-4 py-3 text-sm">{page.city}</td>
                      <td className="px-4 py-3 text-sm font-mono text-xs">
                        <a href={`/services/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{page.slug}</a>
                      </td>
                      <td className="px-4 py-3 text-sm">{page.impressions || 0}</td>
                      <td className="px-4 py-3 text-sm">{page.clicks || 0}</td>
                      <td className="px-4 py-3 text-sm">{page.ctr ? `${(page.ctr * 100).toFixed(2)}%` : '0%'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(page.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
