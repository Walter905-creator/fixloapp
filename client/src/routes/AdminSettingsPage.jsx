import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

function getAuthHeaders() {
  const token = localStorage.getItem('fixlo_token');
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({
    defaultLeadRadius: 25,
    maxLeadsPerPro: 10,
    autoAssignEnabled: true,
    smsPriorityEnabled: true,
    aiLeadHunterEnabled: true,
    seoEngineEnabled: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/settings`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSettings(data);
      setForm({
        defaultLeadRadius: data.defaultLeadRadius ?? 25,
        maxLeadsPerPro: data.maxLeadsPerPro ?? 10,
        autoAssignEnabled: data.autoAssignEnabled ?? true,
        smsPriorityEnabled: data.smsPriorityEnabled ?? true,
        aiLeadHunterEnabled: data.aiLeadHunterEnabled ?? true,
        seoEngineEnabled: data.seoEngineEnabled ?? true
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      const data = await res.json();
      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (field) => {
    setForm(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const ToggleRow = ({ label, field, description }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <div className="font-medium text-gray-800">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => toggleField(field)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form[field] ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[field] ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const healthBadge = (ok) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {ok ? '✅ Connected' : '❌ Not connected'}
    </span>
  );

  return (<>
    <HelmetSEO
      title="Admin Settings | Fixlo"
      canonicalPathname="/dashboard/admin/settings"
      robots="noindex, nofollow"
    />
    <div className="container-xl py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">⚙️ Admin Settings</h1>
          <p className="text-sm text-gray-600">Configure system behavior and integrations</p>
        </div>
        <a href="/dashboard/admin" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</a>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading settings…</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">

          {/* Integration Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Integration Status</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stripe Webhook</span>
                {healthBadge(settings?.stripeWebhookStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Twilio SMS</span>
                {healthBadge(settings?.twilioHealthStatus)}
              </div>
            </div>
          </div>

          {/* Lead Routing */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Lead Routing</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Lead Radius (miles)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={form.defaultLeadRadius}
                  onChange={e => setForm(p => ({ ...p, defaultLeadRadius: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Leads Per Pro</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.maxLeadsPerPro}
                  onChange={e => setForm(p => ({ ...p, maxLeadsPerPro: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <ToggleRow label="Auto-assign Jobs" field="autoAssignEnabled" description="Automatically assign jobs to available pros" />
            <ToggleRow label="SMS Priority Enabled" field="smsPriorityEnabled" description="Send priority SMS alerts for new leads" />
          </div>

          {/* Engine Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Engine Controls</h2>
            <ToggleRow label="AI Lead Hunter" field="aiLeadHunterEnabled" description="Enable automated AI-powered lead detection" />
            <ToggleRow label="SEO AI Engine" field="seoEngineEnabled" description="Enable automated SEO content generation" />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">❌ {error}</div>
          )}
          {saved && (
            <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded text-sm">✅ Settings saved successfully</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  </>);
}
