import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';

export default function AdminSEOAIPage() {
  const [health, setHealth] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealth();
    fetchPages();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/seo-ai/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health:', err);
    }
  };

  const fetchPages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/seo-ai/pages?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch pages');
      }
      
      const data = await res.json();
      setPages(data.pages || []);
    } catch (err) {
      console.error('Failed to fetch pages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runNow = async () => {
    try {
      setRunning(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/seo-ai/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to run');
      }
      
      alert(`SEO AI Engine completed!\n${data.pagesGenerated || 0} pages generated.`);
      fetchHealth();
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
            <h1 className="text-2xl font-extrabold mb-2">🔍 SEO AI Engine</h1>
            <p className="text-sm text-gray-600">Automated SEO content generation and optimization</p>
          </div>
          <div>
            <a 
              href="/dashboard/admin" 
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Health Stats */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className="text-xl font-bold">
              {health?.running ? (
                <span className="text-yellow-600">Running</span>
              ) : (
                <span className="text-green-600">Ready</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Today</div>
            <div className="text-xl font-bold text-blue-600">{health?.pagesGeneratedToday || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Total Pages</div>
            <div className="text-xl font-bold">{health?.totalPages || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Errors</div>
            <div className="text-xl font-bold text-red-600">{health?.errors || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">OpenAI</div>
            <div className="text-sm font-bold">
              {health?.openaiConfigured ? '✅' : '⚠️'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Database</div>
            <div className="text-sm font-bold">
              {health?.databaseConnected ? '✅' : '⚠️'}
            </div>
          </div>
        </div>

        {/* Last Run */}
        {health?.lastRun && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-green-800">
              <strong>Last Run:</strong> {new Date(health.lastRun).toLocaleString()}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-bold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={runNow}
              disabled={running || health?.running}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {running ? 'Running...' : 'Run Now'}
            </button>
            <p className="text-sm text-gray-600">
              Manually trigger the SEO AI Engine. Scheduled to run daily at 3:30 AM automatically.
            </p>
          </div>
        </div>

        {/* Recent Pages */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Recent SEO Pages ({pages.length})</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
              Error: {error}
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No SEO pages generated yet
            </div>
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
                        <a 
                          href={`/services/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {page.slug}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">{page.impressions || 0}</td>
                      <td className="px-4 py-3 text-sm">{page.clicks || 0}</td>
                      <td className="px-4 py-3 text-sm">
                        {page.ctr ? `${(page.ctr * 100).toFixed(2)}%` : '0%'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(page.createdAt).toLocaleDateString()}
                      </td>
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
