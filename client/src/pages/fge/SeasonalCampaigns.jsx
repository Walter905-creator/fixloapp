/**
 * FGE Seasonal Campaigns — auto-recommended seasonal marketing.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

const SEASON_ICONS = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️' };

export default function SeasonalCampaigns() {
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ type: 'email', audience: 'homeowners' });

  useEffect(() => { loadCurrent(); }, []);

  async function loadCurrent() {
    setLoading(true);
    try {
      const result = await fgeApi.getCurrentSeason();
      setCurrent(result);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleGenerate(service) {
    setGenerating(true); setError(''); setSuccess('');
    try {
      await fgeApi.generateSeasonal({ ...form, service });
      setSuccess(`${form.type} campaign generated for "${service}"!`);
      loadCurrent();
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  }

  return (
    <FGELayout>
      <h2 className="text-2xl font-bold text-white mb-6">Seasonal Campaign Manager</h2>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      {loading && <p className="text-gray-400">Loading…</p>}

      {current && (
        <>
          {/* Current season banner */}
          <div className="bg-gradient-to-r from-blue-900/60 to-purple-900/60 border border-blue-700 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{SEASON_ICONS[current.season]}</span>
              <div>
                <h3 className="text-xl font-bold text-white capitalize">{current.season} Season</h3>
                <p className="text-gray-300 text-sm">Recommended services to promote right now</p>
              </div>
            </div>

            {/* Campaign type selector */}
            <div className="flex gap-3 mb-4">
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                {['email','sms','facebook','instagram','linkedin','x'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                {['homeowners','contractors','all'].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Service buttons */}
            <div className="flex flex-wrap gap-2">
              {(current.recommendedServices || []).map((svc) => (
                <button key={svc} onClick={() => handleGenerate(svc)} disabled={generating}
                  className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-full capitalize transition-colors">
                  {generating ? '…' : `✨ ${svc}`}
                </button>
              ))}
            </div>
          </div>

          {/* Existing seasonal campaigns */}
          {current.campaigns && current.campaigns.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <h3 className="font-semibold text-white px-5 py-4 border-b border-gray-700">
                {current.campaigns.length} Existing {current.season} Campaigns
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                      <th className="px-5 py-3">Title</th><th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.campaigns.map((c) => (
                      <tr key={c._id} className="border-b border-gray-700/50">
                        <td className="px-5 py-3 text-white font-medium truncate max-w-xs">{c.title}</td>
                        <td className="px-5 py-3 text-gray-300 text-xs">{c.type}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{c.status}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </FGELayout>
  );
}
