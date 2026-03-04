import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminLeadHunterPage() {
  const [status, setStatus] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    fetchLeads();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/lead-hunter/status`, { headers: getAuthHeaders() });
      if (res.ok) setStatus(await res.json());
    } catch (err) {
      console.error('Failed to fetch lead-hunter status:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/lead-hunter/leads?limit=10`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setToggling(true);
      const res = await fetch(`${API_BASE}/api/admin/lead-hunter/toggle`, {
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
      const res = await fetch(`${API_BASE}/api/admin/lead-hunter/run-now`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run');
      alert('Lead Hunter triggered successfully!');
      fetchStatus();
      fetchLeads();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <HelmetSEO
        title="AI Lead Hunter | Admin | Fixlo"
        canonicalPathname="/dashboard/admin/lead-hunter"
        robots="noindex, nofollow"
      />
      <div className="container-xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">🤖 AI Lead Hunter</h1>
            <p className="text-sm text-gray-600">AI-powered lead detection and distribution</p>
          </div>
          <a href="/dashboard/admin" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</a>
        </div>

        {/* Status Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className="text-xl font-bold">
              {status === null ? <span className="text-gray-400">…</span>
                : status.enabled ? <span className="text-green-600">Enabled</span>
                : <span className="text-red-500">Disabled</span>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Leads Today</div>
            <div className="text-xl font-bold text-blue-700">{status?.leadsCapturedToday ?? '–'}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Total Leads</div>
            <div className="text-xl font-bold">{status?.totalLeadsCaptured ?? '–'}</div>
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
              <span className="text-sm font-medium text-gray-700">Auto-run</span>
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {running ? 'Running…' : '▶ Run Now'}
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-500">Scheduled to run every 15 minutes automatically when enabled.</p>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Last 10 Captured Leads</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading…</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">Error: {error}</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No AI-generated leads yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{lead.trade}</td>
                      <td className="px-4 py-3 text-sm">{lead.city || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          lead.urgency === 'Same day' ? 'bg-red-100 text-red-800' :
                          lead.urgency === 'Within 48 hours' ? 'bg-orange-100 text-orange-800' :
                          lead.urgency === 'This week' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                          {lead.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          lead.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          lead.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(lead.createdAt).toLocaleString()}</td>
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
