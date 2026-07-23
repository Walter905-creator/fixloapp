import React, { useEffect, useMemo, useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

function authHeaders() {
  const token = localStorage.getItem('fixlo_token') || localStorage.getItem('fixlo_admin_token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? 'Bearer ' + token : ''
  };
}

const defaultSettings = {
  enabled: true,
  targetFormId: '',
  invitationCodePrefix: 'FIXLO',
  invitationCodeLength: 8,
  invitationCodeExpiryDays: 30,
  signupLink: 'https://fixloapp.com/pros',
  supportEmail: 'support@fixloapp.com',
  supportPhone: '',
  dataAccessExpiresAt: null,
  dataAccessWarningDays: 14,
  followUpTimingsHours: [24, 72, 168, 336],
  automaticReminders: true,
  ownerNotifications: {
    newLead: true,
    registered: true,
    invitationRedeemed: true,
    subscribed: true
  },
  smsTemplates: {},
  emailTemplates: {}
};

export default function AdminLeadAutomationPage() {
  const [metrics, setMetrics] = useState(null);
  const [metaConnection, setMetaConnection] = useState(null);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState({ search: '', status: '', followUpStatus: '' });

  const stats = useMemo(() => [
    ['Total Meta Leads', metrics?.totalMetaLeads || 0],
    ["Today's Leads", metrics?.todayLeads || 0],
    ['This Week', metrics?.weekLeads || 0],
    ['This Month', metrics?.monthLeads || 0],
    ['Pending Follow-Ups', metrics?.pendingFollowUps || 0],
    ['Completed Follow-Ups', metrics?.completedFollowUps || 0],
    ['Registered Leads', metrics?.registeredLeads || 0],
    ['Subscribed Pros', metrics?.subscribedPros || 0],
    ['Conversion Rate', `${Number(metrics?.conversionRate || 0).toFixed(1)}%`],
    ['SMS Delivery Rate', `${Number(metrics?.smsDeliveryRate || 0).toFixed(1)}%`],
    ['Email Open Rate', `${Number(metrics?.emailOpenRate || 0).toFixed(1)}%`],
    ['Email Click Rate', `${Number(metrics?.emailClickRate || 0).toFixed(1)}%`],
    ['Codes Issued', metrics?.invitationCodesIssued || 0],
    ['Codes Redeemed', metrics?.invitationCodesRedeemed || 0],
    ['Opt-Out Rate', `${Number(metrics?.optOutRate || 0).toFixed(1)}%`],
    ['Avg Registration Time', `${Number(metrics?.averageRegistrationHours || 0).toFixed(1)}h`],
    ['Avg Follow-Up Time', `${Number(metrics?.averageFollowUpHours || 0).toFixed(1)}h`],
    ['Best Campaign', metrics?.bestPerformingCampaign || '—'],
    ['Best Ad', metrics?.bestPerformingAd || '—'],
    ['Best Trade', metrics?.bestPerformingTrade || '—'],
    ['Best State', metrics?.bestPerformingState || '—']
  ], [metrics]);

  const loadDashboard = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const searchParams = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.followUpStatus ? { followUpStatus: query.followUpStatus } : {})
      });

      const [dashboardRes, leadsRes, metaFormsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/meta-leads/dashboard`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/admin/meta-leads?${searchParams.toString()}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/admin/meta-leads/meta/forms`, { headers: authHeaders() })
      ]);

      if (!dashboardRes.ok || !leadsRes.ok || !metaFormsRes.ok) throw new Error('Failed to load lead automation data');

      const dashboardData = await dashboardRes.json();
      const leadsData = await leadsRes.json();
      const metaFormsData = await metaFormsRes.json();

      setMetrics(dashboardData.metrics || null);
      setSettings({ ...defaultSettings, ...(dashboardData.settings || {}) });
      setMetaConnection(metaFormsData.ok ? metaFormsData : null);
      setLeads(leadsData.items || []);
      setPagination(leadsData.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(1);
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/meta-leads/settings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save settings');
      setSettings({ ...defaultSettings, ...(data.settings || {}) });
      await loadDashboard(pagination.page || 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const runJob = async (job, body = null) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/meta-leads/jobs/${job}/run`, {
        method: 'POST',
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Failed to run ${job}`);
      await loadDashboard(pagination.page || 1);
    } catch (e) {
      setError(e.message);
    }
  };

  const updateTiming = (index, value) => {
    const next = [...(settings.followUpTimingsHours || [24, 72, 168, 336])];
    next[index] = Number(value || 0);
    setSettings((prev) => ({ ...prev, followUpTimingsHours: next }));
  };

  return (
    <>
      <HelmetSEO title="Lead Automation | Fixlo" canonicalPathname="/dashboard/admin/lead-automation" robots="noindex, nofollow" />
      <div className="container-xl py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">📥 Meta Lead Automation</h1>
            <p className="text-sm text-gray-600">Instagram & Facebook lead ads follow-up control center</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => runJob('followups')} className="px-3 py-2 rounded border border-slate-300 text-sm">Run Follow-Ups</button>
            <button onClick={() => runJob('reconcile')} className="px-3 py-2 rounded border border-slate-300 text-sm">Run Reconcile</button>
            <button onClick={() => runJob('meta-reconcile', { formId: settings.targetFormId || undefined, daysBack: 30 })} className="px-3 py-2 rounded border border-emerald-300 text-sm text-emerald-700">Run 30-Day Meta Reconcile</button>
            <button onClick={() => loadDashboard(pagination.page || 1)} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Refresh</button>
          </div>
        </div>

        {error && <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>}
        {metaConnection?.warning && (
          <div className={`p-3 rounded border text-sm ${
            metaConnection.warning.severity === 'error'
              ? 'border-red-300 bg-red-50 text-red-700'
              : metaConnection.warning.severity === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-sky-300 bg-sky-50 text-sky-800'
          }`}>
            {metaConnection.warning.message}
          </div>
        )}

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <form onSubmit={saveSettings} className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold">Automation Settings</h2>
            <label className="flex items-center justify-between text-sm">
              <span>Enable automation</span>
              <input type="checkbox" checked={!!settings.enabled} onChange={(e) => setSettings((p) => ({ ...p, enabled: e.target.checked }))} />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Automatic reminders</span>
              <input type="checkbox" checked={!!settings.automaticReminders} onChange={(e) => setSettings((p) => ({ ...p, automaticReminders: e.target.checked }))} />
            </label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label htmlFor="meta-target-form-id" className="block text-xs text-gray-500 mb-1">Target form ID</label>
                <input id="meta-target-form-id" aria-label="Target form ID" className="w-full border rounded px-2 py-1" value={settings.targetFormId || ''} onChange={(e) => setSettings((p) => ({ ...p, targetFormId: e.target.value.replace(/\D+/g, '') }))} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Code prefix</p>
                <input className="w-full border rounded px-2 py-1" value={settings.invitationCodePrefix || 'FIXLO'} onChange={(e) => setSettings((p) => ({ ...p, invitationCodePrefix: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Code length</p>
                <input type="number" min="8" max="10" className="w-full border rounded px-2 py-1" value={settings.invitationCodeLength || 8} onChange={(e) => setSettings((p) => ({ ...p, invitationCodeLength: Number(e.target.value) }))} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Expiry (days)</p>
                <input type="number" min="1" max="365" className="w-full border rounded px-2 py-1" value={settings.invitationCodeExpiryDays || 30} onChange={(e) => setSettings((p) => ({ ...p, invitationCodeExpiryDays: Number(e.target.value) }))} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Support phone</p>
                <input className="w-full border rounded px-2 py-1" value={settings.supportPhone || ''} onChange={(e) => setSettings((p) => ({ ...p, supportPhone: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="meta-data-access-expires" className="block text-xs text-gray-500 mb-1">Meta data access expires</label>
                <input id="meta-data-access-expires" aria-label="Meta data access expiration date" type="date" className="w-full border rounded px-2 py-1" value={settings.dataAccessExpiresAt ? String(settings.dataAccessExpiresAt).slice(0, 10) : ''} onChange={(e) => setSettings((p) => ({ ...p, dataAccessExpiresAt: e.target.value || null }))} />
              </div>
              <div>
                <label htmlFor="meta-data-access-warning-days" className="block text-xs text-gray-500 mb-1">Warn before expiry (days)</label>
                <input id="meta-data-access-warning-days" aria-label="Warn before expiry days" type="number" min="1" className="w-full border rounded px-2 py-1" value={settings.dataAccessWarningDays || 14} onChange={(e) => setSettings((p) => ({ ...p, dataAccessWarningDays: Number(e.target.value || 14) }))} />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-xs text-gray-500">Follow-up timing (hours from submission)</p>
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <span>Step {idx + 1}</span>
                  <input type="number" min="1" className="w-28 border rounded px-2 py-1" value={settings.followUpTimingsHours?.[idx] || 0} onChange={(e) => updateTiming(idx, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-xs text-gray-500">Owner notifications</p>
              {['newLead', 'registered', 'invitationRedeemed', 'subscribed'].map((key) => (
                <label className="flex items-center justify-between" key={key}>
                  <span>{key}</span>
                  <input
                    type="checkbox"
                    checked={!!settings.ownerNotifications?.[key]}
                    onChange={(e) => setSettings((p) => ({
                      ...p,
                      ownerNotifications: {
                        ...(p.ownerNotifications || {}),
                        [key]: e.target.checked
                      }
                    }))}
                  />
                </label>
              ))}
            </div>
            <button disabled={saving} className="w-full py-2 rounded bg-emerald-600 text-white text-sm">{saving ? 'Saving…' : 'Save Settings'}</button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">Meta Form Access</h2>
                  <p className="text-xs text-gray-500">Graph API {metaConnection?.graphApiVersion || '—'} · Page {metaConnection?.pageId || '—'}</p>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Classification: {metaConnection?.classification || '—'}
                </div>
              </div>
              {metaConnection?.directFormLookup?.error && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  Direct form lookup: {metaConnection.directFormLookup.error}
                </div>
              )}
              {metaConnection?.pageFormsError && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                  Page forms lookup: {metaConnection.pageFormsError}
                </div>
              )}
              <div className="overflow-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2">ID</th>
                      <th className="py-2">Name</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Created</th>
                      <th className="py-2">Page</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(metaConnection?.accessibleForms || []).map((form) => (
                      <tr key={form.id} className={`border-b last:border-b-0 ${form.id === metaConnection?.targetFormId ? 'bg-emerald-50' : ''}`}>
                        <td className="py-2 font-mono">{form.id}</td>
                        <td className="py-2">{form.name || '—'}</td>
                        <td className="py-2">{form.status || '—'}</td>
                        <td className="py-2">{form.createdTime ? new Date(form.createdTime).toLocaleString() : '—'}</td>
                        <td className="py-2 font-mono">{form.pageId || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!metaConnection?.accessibleForms?.length && <p className="py-2 text-xs text-gray-500">No accessible forms returned.</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={query.search}
                onChange={(e) => setQuery((p) => ({ ...p, search: e.target.value }))}
                placeholder="Search lead, campaign, code"
                className="border rounded px-3 py-2 text-sm flex-1 min-w-[220px]"
              />
              <select value={query.status} onChange={(e) => setQuery((p) => ({ ...p, status: e.target.value }))} className="border rounded px-2 py-2 text-sm">
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="registered">Registered</option>
                <option value="subscribed">Subscribed</option>
                <option value="closed">Closed</option>
              </select>
              <select value={query.followUpStatus} onChange={(e) => setQuery((p) => ({ ...p, followUpStatus: e.target.value }))} className="border rounded px-2 py-2 text-sm">
                <option value="">All Follow-up</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="stopped">Stopped</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={() => loadDashboard(1)} className="px-3 py-2 bg-slate-900 text-white rounded text-sm">Filter</button>
            </div>

            {loading ? <div className="text-sm text-gray-500 py-8 text-center">Loading leads…</div> : (
              <>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2">Lead</th>
                        <th className="py-2">Source</th>
                        <th className="py-2">Campaign</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Follow-Up</th>
                        <th className="py-2">Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead._id} className="border-b last:border-b-0 hover:bg-slate-50">
                          <td className="py-2">
                            <a className="text-blue-700 font-medium" href={`/dashboard/admin/lead-automation/${lead._id}`}>
                              {(lead.firstName || '') + ' ' + (lead.lastName || '') || lead.email || lead.phone || 'Lead'}
                            </a>
                            <div className="text-xs text-gray-500">{lead.trade || '—'} · {lead.city || '—'}, {lead.state || '—'}</div>
                          </td>
                          <td className="py-2 capitalize">{lead.source?.replace('_', ' ') || '—'}</td>
                          <td className="py-2">{lead.campaign?.campaignName || '—'}</td>
                          <td className="py-2 capitalize">{lead.leadStatus}</td>
                          <td className="py-2 capitalize">{lead.followUp?.status || '—'}</td>
                          <td className="py-2 font-mono text-xs">{lead.invitationCode || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 text-sm">
                  <p className="text-gray-600">{pagination.total || 0} leads</p>
                  <div className="flex items-center gap-2">
                    <button disabled={(pagination.page || 1) <= 1} onClick={() => loadDashboard((pagination.page || 1) - 1)} className="px-2 py-1 rounded border disabled:opacity-40">Prev</button>
                    <span>Page {pagination.page || 1} / {pagination.totalPages || 1}</span>
                    <button disabled={(pagination.page || 1) >= (pagination.totalPages || 1)} onClick={() => loadDashboard((pagination.page || 1) + 1)} className="px-2 py-1 rounded border disabled:opacity-40">Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
