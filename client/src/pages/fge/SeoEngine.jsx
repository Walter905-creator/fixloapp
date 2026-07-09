/**
 * FGE SEO Engine — batch generate service+city landing pages.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC',
  'ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function SeoEngine() {
  const [pages, setPages] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Single page form
  const [single, setSingle] = useState({ service: '', city: '', state: 'NC' });
  const [generating, setGenerating] = useState(false);

  // Batch form
  const [batchService, setBatchService] = useState('');
  const [batchCities, setBatchCities] = useState('Charlotte, NC\nRaleigh, NC\nDurham, NC');
  const [batching, setBatching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, j] = await Promise.all([fgeApi.getSeoPages({ limit: 30 }), fgeApi.getSeoJobs()]);
      setPages(p.pages || []);
      setJobs(j.jobs || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSingle(e) {
    e.preventDefault();
    if (!single.service || !single.city || !single.state) return setError('All fields required.');
    setGenerating(true); setError(''); setSuccess('');
    try {
      const result = await fgeApi.generatePage(single);
      setSuccess(`Page created: /${result.page.slug}`);
      loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleBatch(e) {
    e.preventDefault();
    if (!batchService || !batchCities.trim()) return setError('Service and cities required.');
    setBatching(true); setError(''); setSuccess('');
    try {
      const cities = batchCities.trim().split('\n').map((line) => {
        const parts = line.trim().split(',').map((s) => s.trim());
        return { city: parts[0], state: parts[1] || 'NC' };
      }).filter((c) => c.city);
      const result = await fgeApi.batchSeoPages({ service: batchService, cities });
      setSuccess(`Batch queued: ${result.queued} pages for "${batchService}"`);
      loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setBatching(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this landing page?')) return;
    try {
      await fgeApi.deleteSeoPage(id);
      loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <FGELayout>
      <h2 className="text-2xl font-bold text-white mb-6">SEO Engine</h2>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Single page */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Generate Single Landing Page</h3>
          <form onSubmit={handleSingle} className="space-y-4">
            <input
              type="text" placeholder="Service (e.g. plumber)" value={single.service}
              onChange={(e) => setSingle((s) => ({ ...s, service: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" placeholder="City" value={single.city}
                onChange={(e) => setSingle((s) => ({ ...s, city: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              <select
                value={single.state}
                onChange={(e) => setSingle((s) => ({ ...s, state: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button
              type="submit" disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              {generating ? 'Generating…' : '🔍 Generate Page'}
            </button>
          </form>
        </div>

        {/* Batch */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Batch Generate (one city per line)</h3>
          <form onSubmit={handleBatch} className="space-y-4">
            <input
              type="text" placeholder="Service (e.g. electrician)" value={batchService}
              onChange={(e) => setBatchService(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
            <textarea
              rows={6} value={batchCities}
              onChange={(e) => setBatchCities(e.target.value)}
              placeholder="Charlotte, NC&#10;Dallas, TX&#10;Miami, FL"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono"
            />
            <button
              type="submit" disabled={batching}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              {batching ? 'Queuing…' : '📦 Batch Generate'}
            </button>
          </form>
        </div>
      </div>

      {/* Pages table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Landing Pages ({pages.length})</h3>
          <button onClick={loadData} className="text-xs text-gray-400 hover:text-white">↻ Refresh</button>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm p-5">Loading…</p>
        ) : pages.length === 0 ? (
          <p className="text-gray-400 text-sm p-5">No pages yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Indexing</th>
                  <th className="px-5 py-3">Views</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-blue-400 font-mono text-xs">/{p.slug}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.status === 'published' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${p.indexingStatus === 'indexed' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>{p.indexingStatus}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-300">{p.views ?? 0}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(p._id)} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-2 py-1 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Jobs */}
      {jobs.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <h3 className="font-semibold text-white px-5 py-4 border-b border-gray-700">Batch Jobs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Pages</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j._id} className="border-b border-gray-700/50">
                    <td className="px-5 py-3 text-white font-medium">{j.service}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${j.status === 'completed' ? 'bg-green-900 text-green-300' : j.status === 'failed' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{j.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-300">{j.createdPages}/{j.totalPages}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(j.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </FGELayout>
  );
}
