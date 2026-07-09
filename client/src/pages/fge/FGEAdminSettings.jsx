/**
 * FGE Admin Settings — configure API keys and test integrations.
 */

import React, { useEffect, useState } from 'react';
import FGELayout from './FGELayout';
import { fgeApi } from '../../lib/fgeApi';

const SERVICES = [
  { key: 'openai',      label: 'OpenAI (GPT + DALL-E)',       icon: '🤖', envVar: 'OPENAI_API_KEY' },
  { key: 'sendgrid',    label: 'SendGrid (Email)',             icon: '📧', envVar: 'SENDGRID_API_KEY' },
  { key: 'twilio',      label: 'Twilio (SMS)',                 icon: '💬', envVar: 'TWILIO_ACCOUNT_SID' },
  { key: 'stripe',      label: 'Stripe (Payments)',           icon: '💳', envVar: 'STRIPE_SECRET_KEY' },
  { key: 'cloudinary',  label: 'Cloudinary (Images)',         icon: '🖼️',  envVar: 'CLOUDINARY_CLOUD_NAME' },
];

export default function FGEAdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const { settings } = await fgeApi.getSettings();
      setSettings(settings || {});
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await fgeApi.updateSettings(settings);
      setSuccess('Settings saved!');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleTest(serviceKey) {
    setTesting((t) => ({ ...t, [serviceKey]: true }));
    setTestResults((r) => ({ ...r, [serviceKey]: null }));
    try {
      const result = await fgeApi.testConnection(serviceKey);
      setTestResults((r) => ({ ...r, [serviceKey]: result }));
    } catch (e) {
      setTestResults((r) => ({ ...r, [serviceKey]: { ok: false, message: e.message } }));
    } finally {
      setTesting((t) => ({ ...t, [serviceKey]: false }));
    }
  }

  return (
    <FGELayout>
      <h2 className="text-2xl font-bold text-white mb-6">FGE Settings</h2>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">{success}</div>}

      {/* Integration status */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">Integration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SERVICES.map((svc) => (
            <div key={svc.key} className="bg-gray-700 rounded-lg p-4 flex items-start gap-3">
              <span className="text-2xl">{svc.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{svc.label}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{svc.envVar}</p>
                {testResults[svc.key] && (
                  <p className={`text-xs mt-1 ${testResults[svc.key].ok ? 'text-green-400' : 'text-red-400'}`}>
                    {testResults[svc.key].ok ? '✅' : '❌'} {testResults[svc.key].message}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleTest(svc.key)}
                disabled={testing[svc.key]}
                className="shrink-0 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white text-xs px-2 py-1 rounded"
              >
                {testing[svc.key] ? '…' : 'Test'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature flags */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-3">Feature Flags</h3>
        <div className="text-sm text-gray-400 space-y-2">
          <p>
            <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs text-blue-300">FGE_ENABLED=true</code>
            {' '} — Enable the entire Growth Engine module
          </p>
          <p>
            <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs text-blue-300">SITE_BASE_URL</code>
            {' '} — Used in SEO canonical URLs and landing page links (default: https://fixloapp.com)
          </p>
          <p>
            <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs text-blue-300">FGE_EMAIL_FROM</code>
            {' '} — Sender address for FGE emails (default: hello@fixloapp.com)
          </p>
        </div>
      </div>

      {/* Saved settings form */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Saved Configuration</h3>
        <p className="text-xs text-gray-500 mb-4">
          API keys set here are stored in AdminSettings (MongoDB). Server environment variables take precedence.
          Existing key values are masked for security.
        </p>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {[
              { key: 'siteName',      label: 'Site Name',           type: 'text',     placeholder: 'Fixlo' },
              { key: 'siteBaseUrl',   label: 'Site Base URL',       type: 'url',      placeholder: 'https://fixloapp.com' },
              { key: 'fgeEmailFrom',  label: 'Email From Address',  type: 'email',    placeholder: 'hello@fixloapp.com' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 block mb-1">{label}</label>
                <input
                  type={type}
                  value={settings[key] || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2.5 text-sm"
            >
              {saving ? 'Saving…' : '💾 Save Settings'}
            </button>
          </form>
        )}
      </div>
    </FGELayout>
  );
}
