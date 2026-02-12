import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';

export default function AdminLeadHunterPage() {
  const [health, setHealth] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealth();
    fetchLeads();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/lead-hunter/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/lead-hunter/leads?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch leads');
      }
      
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runNow = async () => {
    try {
      setRunning(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/lead-hunter/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to run');
      }
      
      alert('Lead Hunter executed successfully!');
      fetchHealth();
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
            <h1 className="text-2xl font-extrabold mb-2">🤖 AI Lead Hunter</h1>
            <p className="text-sm text-gray-600">AI-powered lead detection and distribution</p>
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
        <div className="grid md:grid-cols-5 gap-4 mb-8">
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
            <div className="text-sm text-gray-500 mb-1">Leads Generated</div>
            <div className="text-xl font-bold">{health?.leadsGenerated || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Errors</div>
            <div className="text-xl font-bold text-red-600">{health?.errors || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">OpenAI</div>
            <div className="text-sm font-bold">
              {health?.openaiConfigured ? '✅ Configured' : '⚠️ Not Configured'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Twilio</div>
            <div className="text-sm font-bold">
              {health?.twilioConfigured ? '✅ Configured' : '⚠️ Not Configured'}
            </div>
          </div>
        </div>

        {/* Last Run */}
        {health?.lastRun && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-blue-800">
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
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {running ? 'Running...' : 'Run Now'}
            </button>
            <p className="text-sm text-gray-600">
              Manually trigger the AI Lead Hunter. Scheduled to run every 15 minutes automatically.
            </p>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Recent AI-Generated Leads ({leads.length})</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
              Error: {error}
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No AI-generated leads yet
            </div>
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
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          lead.urgency === 'Same day' ? 'bg-red-100 text-red-800' :
                          lead.urgency === 'Within 48 hours' ? 'bg-orange-100 text-orange-800' :
                          lead.urgency === 'This week' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          lead.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          lead.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleString()}
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
