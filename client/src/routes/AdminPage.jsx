import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function AdminPage(){
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  const triggerCharlotteTestJob = async () => {
    setTestLoading(true);
    setTestResult(null);
    setTestError('');
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/trigger-charlotte-test-job`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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

  return (<>
    <HelmetSEO 
      title="Admin Dashboard | Fixlo" 
      canonicalPathname="/dashboard/admin" 
      robots="noindex, nofollow" 
    />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold mb-6">Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Job Management Card */}
        <a 
          href="/dashboard/admin/jobs" 
          className="card p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 className="text-xl font-bold mb-2">Job Control Center</h2>
          <p className="text-sm text-gray-600">
            Manage jobs, schedules, and payments
          </p>
        </a>

        {/* Social Media Manager Card */}
        <a 
          href="/dashboard/admin/social" 
          className="card p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <h2 className="text-xl font-bold mb-2">Social Media Manager</h2>
          <p className="text-sm text-gray-600">
            Connect and manage social media accounts
          </p>
        </a>

        {/* AI Lead Hunter Card */}
        <a 
          href="/dashboard/admin/lead-hunter" 
          className="card p-6 hover:shadow-lg transition-shadow border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50"
        >
          <h2 className="text-xl font-bold mb-2">🤖 AI Lead Hunter</h2>
          <p className="text-sm text-gray-600">
            AI-powered lead detection and distribution
          </p>
        </a>

        {/* SEO AI Engine Card */}
        <a 
          href="/dashboard/admin/seo-ai" 
          className="card p-6 hover:shadow-lg transition-shadow border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50"
        >
          <h2 className="text-xl font-bold mb-2">🔍 SEO AI Engine</h2>
          <p className="text-sm text-gray-600">
            Automated SEO content generation and optimization
          </p>
        </a>
      </div>

      {/* Charlotte Notification Test Panel */}
      <div className="mt-8 border border-orange-200 rounded-lg p-6 bg-orange-50">
        <h2 className="text-xl font-bold mb-1">🔔 Test Charlotte Notification Workflow</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sends a sample Plumbing job request for Charlotte, NC and fires both the priority SMS and owner notification to Walter Arevalo.
        </p>
        <button
          onClick={triggerCharlotteTestJob}
          disabled={testLoading}
          className="px-5 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
        >
          {testLoading ? '⏳ Sending…' : '🧪 Trigger Sample Charlotte Job'}
        </button>

        {testError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
            ❌ {testError}
          </div>
        )}

        {testResult && (
          <div className={`mt-4 p-4 rounded border text-sm ${testResult.ok ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
            <p className="font-semibold mb-2">{testResult.ok ? '✅ Notifications dispatched' : '⚠️ Partial result'}</p>
            <p><strong>Owner:</strong> {testResult.ownerName} ({testResult.sentTo})</p>
            <div className="mt-2 space-y-1">
              <p>
                <strong>Priority SMS:</strong>{' '}
                {testResult.notifications?.prioritySms?.success
                  ? <span className="text-green-700">Sent ✅</span>
                  : <span className="text-red-600">Failed ❌ — {testResult.notifications?.prioritySms?.error}</span>}
              </p>
              <p>
                <strong>Owner Notification:</strong>{' '}
                {testResult.notifications?.ownerNotification?.success
                  ? <span className="text-green-700">Sent ✅ (SID: {testResult.notifications.ownerNotification.messageId})</span>
                  : <span className="text-red-600">
                      Failed ❌ — {testResult.notifications?.ownerNotification?.reason}
                    </span>}
              </p>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-gray-500 text-xs">Test lead details</summary>
              <pre className="text-xs mt-1 bg-white p-2 rounded overflow-auto">{JSON.stringify(testResult.testLead, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  </>);
}
