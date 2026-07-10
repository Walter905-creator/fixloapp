/**
 * FGE Queue Monitor — inspect job queue health and retry failures.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

const STATUS_COLORS = {
  pending:    'bg-yellow-900 text-yellow-300',
  processing: 'bg-blue-900 text-blue-300',
  completed:  'bg-green-900 text-green-300',
  failed:     'bg-red-900 text-red-300',
  retrying:   'bg-orange-900 text-orange-300',
};

export default function QueueMonitor() {
  const [stats, setStats] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, [statusFilter]);

  async function loadData() {
    setLoading(true); setError('');
    try {
      const [s, j] = await Promise.all([
        fgeApi.getQueueStats(),
        fgeApi.getQueueJobs(statusFilter ? { status: statusFilter } : {}),
      ]);
      setStats(s.stats || []);
      setJobs(j.jobs || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleRetry(id) {
    try { await fgeApi.retryJob(id); setSuccess('Job requeued!'); loadData(); }
    catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete job?')) return;
    try { await fgeApi.deleteJob(id); loadData(); }
    catch (e) { setError(e.message); }
  }

  // Build status summary from stats
  const statusTotals = {};
  for (const s of stats) {
    const key = s._id?.status;
    if (key) statusTotals[key] = (statusTotals[key] || 0) + s.count;
  }

  return (
    <FGELayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Queue Monitor</h2>
        <button onClick={loadData} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-lg">↻ Refresh</button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      {/* Status summary */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(statusTotals).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              statusFilter === status
                ? 'bg-blue-600 border-blue-500 text-white'
                : `${STATUS_COLORS[status] || 'bg-gray-700 text-gray-300'} border-transparent`
            }`}
          >
            {status}: {count}
          </button>
        ))}
        {statusFilter && (
          <button onClick={() => setStatusFilter('')} className="px-4 py-2 rounded-full text-sm bg-gray-700 text-gray-300 border border-transparent">
            Show all ✕
          </button>
        )}
      </div>

      {/* Jobs table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <h3 className="font-semibold text-white px-5 py-4 border-b border-gray-700">Jobs ({jobs.length})</h3>
        {loading ? <p className="text-gray-400 text-sm p-5">Loading…</p> :
         jobs.length === 0 ? <p className="text-gray-400 text-sm p-5">No jobs found.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="px-5 py-3">Type</th><th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Priority</th><th className="px-5 py-3">Attempts</th>
                  <th className="px-5 py-3">Error</th><th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-white font-medium text-xs font-mono">{j.type}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[j.status] || ''}`}>{j.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-300">{j.priority}</td>
                    <td className="px-5 py-3 text-gray-300">{j.attempts}/{j.maxAttempts}</td>
                    <td className="px-5 py-3 text-red-400 text-xs max-w-xs truncate">{j.error || '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(j.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3 flex gap-2">
                      {j.status === 'failed' && (
                        <button onClick={() => handleRetry(j._id)} className="text-xs bg-blue-800 hover:bg-blue-700 text-white px-2 py-1 rounded">Retry</button>
                      )}
                      <button onClick={() => handleDelete(j._id)} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-2 py-1 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FGELayout>
  );
}
