/**
 * FGE AI Insights — daily growth reports.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

export default function AiInsights() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [t, h] = await Promise.all([fgeApi.getInsightsToday(), fgeApi.getInsightsHistory()]);
      setToday(t.report);
      setHistory(h.reports || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    setGenerating(true); setError(''); setSuccess('');
    try {
      await fgeApi.generateInsights({});
      setSuccess('Report generated!');
      loadData();
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  }

  const usd = (cents) => '$' + ((cents ?? 0) / 100).toFixed(2);
  const fmt = (n) => (n ?? 0).toLocaleString();

  function ReportCard({ report }) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">
            {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <span className="text-xs text-gray-500">Model: {report.model}</span>
        </div>

        {/* Summary */}
        {report.summary && (
          <p className="text-gray-300 text-sm leading-relaxed mb-4 bg-gray-700/50 p-4 rounded-lg">
            {report.summary}
          </p>
        )}

        {/* Metrics */}
        {report.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'New Users', value: fmt(report.metrics.newUsers) },
              { label: 'Revenue', value: usd(report.metrics.revenue) },
              { label: 'Traffic', value: fmt(report.metrics.traffic) },
              { label: 'Conv. Rate', value: `${report.metrics.conversionRate}%` },
            ].map((m) => (
              <div key={m.label} className="bg-gray-700 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{m.value}</p>
                <p className="text-xs text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SEO opportunities */}
          {report.seoOpportunities?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-blue-400 mb-2">🔍 SEO Opportunities</h4>
              <ul className="space-y-1">
                {report.seoOpportunities.map((item, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2">💡 Recommendations</h4>
              <ul className="space-y-1">
                {report.recommendations.map((item, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <FGELayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Insights</h2>
          <p className="text-gray-400 mt-1">Daily AI-generated growth analysis</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {generating ? 'Generating…' : '✨ Generate Report'}
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      {loading && <p className="text-gray-400">Loading…</p>}

      {/* Today's report */}
      {today ? (
        <>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Today</h3>
          <ReportCard report={today} />
        </>
      ) : (
        !loading && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
            <p className="text-gray-400 text-sm">
              No report for today yet. Click <strong>Generate Report</strong> to create one now,
              or wait for the scheduled 6:00 AM job.
            </p>
          </div>
        )
      )}

      {/* History */}
      {history.length > 1 && (
        <>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">Previous Reports</h3>
          {history.slice(1).map((r) => <ReportCard key={r._id} report={r} />)}
        </>
      )}
    </FGELayout>
  );
}
