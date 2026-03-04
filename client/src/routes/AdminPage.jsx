import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/overview`, { headers: getAuthHeaders() });
      if (res.ok) setOverview(await res.json());
    } catch (err) {
      console.error('Overview fetch error:', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  const triggerCharlotteTestJob = async () => {
    setTestLoading(true);
    setTestResult(null);
    setTestError('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/trigger-charlotte-test-job`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({})
      });
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setTestError(err.message);
    } finally {
      setTestLoading(false);
    }
  };

  const healthBadge = (ok) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {ok ? '✅ Online' : '❌ Offline'}
    </span>
  );

  return (<>
    <HelmetSEO
      title="Admin Dashboard | Fixlo"
      canonicalPathname="/dashboard/admin"
      robots="noindex, nofollow"
    />
    <div className="container-xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
        <button onClick={loadOverview} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
      </div>

      {/* Overview Metrics */}
      {overviewLoading ? (
        <div className="text-center py-6 text-gray-400">Loading metrics…</div>
      ) : overview ? (
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Total Pros</div>
              <div className="text-2xl font-bold">{overview.totalPros ?? '–'}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Active Pros</div>
              <div className="text-2xl font-bold text-green-700">{overview.activePros ?? '–'}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Leads Today</div>
              <div className="text-2xl font-bold text-blue-700">{overview.leadsToday ?? '–'}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Revenue (Month)</div>
              <div className="text-2xl font-bold text-indigo-700">${(overview.totalRevenueMonth || 0).toFixed(2)}</div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">System Health</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2"><span className="text-gray-500">Stripe</span>{healthBadge(overview.systemHealth?.stripe)}</div>
              <div className="flex items-center gap-2"><span className="text-gray-500">Twilio</span>{healthBadge(overview.systemHealth?.twilio)}</div>
              <div className="flex items-center gap-2"><span className="text-gray-500">AI Lead Hunter</span>{healthBadge(overview.systemHealth?.aiLeadHunter)}</div>
              <div className="flex items-center gap-2"><span className="text-gray-500">SEO Engine</span>{healthBadge(overview.systemHealth?.seoEngine)}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <a href="/dashboard/admin/jobs" className="card p-6 hover:shadow-lg transition-shadow border border-gray-200">
          <h2 className="text-xl font-bold mb-1">📋 Job Control Center</h2>
          <p className="text-sm text-gray-600">Manage jobs, schedules, and payments</p>
        </a>
        <a href="/dashboard/admin/social" className="card p-6 hover:shadow-lg transition-shadow border border-gray-200">
          <h2 className="text-xl font-bold mb-1">📱 Social Media Manager</h2>
          <p className="text-sm text-gray-600">Connect and manage social media accounts</p>
        </a>
        <a href="/dashboard/admin/lead-hunter" className="card p-6 hover:shadow-lg transition-shadow border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold mb-1">🤖 AI Lead Hunter</h2>
          <p className="text-sm text-gray-600">AI-powered lead detection and distribution</p>
        </a>
        <a href="/dashboard/admin/seo-ai" className="card p-6 hover:shadow-lg transition-shadow border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <h2 className="text-xl font-bold mb-1">🔍 SEO AI Engine</h2>
          <p className="text-sm text-gray-600">Automated SEO content generation and optimization</p>
        </a>
        <a href="/dashboard/admin/settings" className="card p-6 hover:shadow-lg transition-shadow border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <h2 className="text-xl font-bold mb-1">⚙️ Admin Settings</h2>
          <p className="text-sm text-gray-600">Configure lead radius, auto-assign, and integrations</p>
        </a>
      </div>

      {/* Charlotte Test Workflow Panel */}
      <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
        <h2 className="text-xl font-bold mb-1">🔔 Test Charlotte Notification Workflow</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sends a sample Plumbing job for Charlotte, NC and fires both the priority SMS and owner notification.
        </p>
        <button
          onClick={triggerCharlotteTestJob}
          disabled={testLoading}
          className="px-5 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
        >
          {testLoading ? '⏳ Sending…' : '🧪 Trigger Sample Charlotte Job'}
        </button>

        {testError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">❌ {testError}</div>
        )}

        {testResult && (
          <div className={`mt-4 p-4 rounded border text-sm ${testResult.ok ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
            <p className="font-semibold mb-3">{testResult.ok ? '✅ Notifications dispatched' : '⚠️ Partial result'}</p>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Job Details</p>
                <p><strong>Job ID:</strong> <code className="text-xs bg-white px-1 rounded">{testResult.jobId || testResult.testLead?._id}</code></p>
                <p><strong>Job Created:</strong> {testResult.jobCreated ? '✅ Yes' : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Assigned Pro</p>
                <p><strong>Name:</strong> {testResult.assignedPro?.name || testResult.ownerName}</p>
                <p><strong>Phone:</strong> {testResult.assignedPro?.phone || testResult.sentTo}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">SMS Delivery</p>
                <p><strong>Priority SMS:</strong>{' '}
                  {(testResult.prioritySmsSent ?? testResult.notifications?.prioritySms?.success)
                    ? <span className="text-green-700">Sent ✅</span>
                    : <span className="text-red-600">Failed ❌</span>}
                </p>
                <p><strong>Owner Notification:</strong>{' '}
                  {(testResult.ownerNotificationSent ?? testResult.notifications?.ownerNotification?.success)
                    ? <span className="text-green-700">Sent ✅{testResult.notifications?.ownerNotification?.messageId ? ` (SID: ${testResult.notifications.ownerNotification.messageId})` : ''}</span>
                    : <span className="text-red-600">Failed ❌{testResult.notifications?.ownerNotification?.reason ? ` — ${testResult.notifications.ownerNotification.reason}` : ''}</span>}
                </p>
              </div>
              {testResult.errors?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Errors</p>
                  {testResult.errors.map((e, i) => <p key={i} className="text-red-600 text-xs">• {e}</p>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </>);
}
