/**
 * InternalDashboardPage — /dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Private Fixlo internal dashboard for admin users only.
 * Access is guarded by RequireAdmin in App.jsx.
 *
 * Sections:
 *   1. Overview  — platform-wide stats (pros, homeowners, leads, recruiters, invite codes)
 *   2. Invitation Codes — generate, list, search, filter, copy, revoke
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';

// ─── Auth helper ──────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem('fixlo_token');
  const scheme = 'Bearer';
  return { 'Authorization': scheme + ' ' + token, 'Content-Type': 'application/json' };
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  'bg-yellow-100 text-yellow-800',
    redeemed: 'bg-green-100 text-green-800',
    expired:  'bg-slate-100 text-slate-600',
    revoked:  'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || ''}`}>{value ?? '–'}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function InternalDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'invite-codes'

  // ── Overview state ────────────────────────────────────────────────────────
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // ── Invite codes state ────────────────────────────────────────────────────
  const [codes, setCodes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [codesLoading, setCodesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Generate form state
  const [genForm, setGenForm] = useState({
    assignedName: '',
    assignedEmail: '',
    assignedPhone: '',
    assignedState: '',
    assignedTrade: '',
    expiresAt: '',
    count: 1,
    bulk: false,
  });
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState('');

  // Revoke state
  const [revokeLoading, setRevokeLoading] = useState('');

  // ── Copy feedback ─────────────────────────────────────────────────────────
  const [copiedCode, setCopiedCode] = useState('');

  // ── Load overview ─────────────────────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/overview`, { headers: authHeaders() });
      if (res.ok) setOverview(await res.json());
    } catch (_) {
      // silently handle
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // ── Load invite codes ─────────────────────────────────────────────────────
  const loadCodes = useCallback(async () => {
    try {
      setCodesLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      params.set('limit', '200');
      const res = await fetch(`${API_BASE}/api/invite-codes?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.invites || []);
        setSummary(data.summary || null);
      }
    } catch (_) {
      // silently handle
    } finally {
      setCodesLoading(false);
    }
  }, [search, filterStatus]);

  // ── Initial loads ─────────────────────────────────────────────────────────
  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => {
    if (activeTab === 'invite-codes') loadCodes();
  }, [activeTab, loadCodes]);

  // ── Generate code(s) ──────────────────────────────────────────────────────
  async function handleGenerate(e) {
    e.preventDefault();
    setGenLoading(true);
    setGenMsg('');
    try {
      const isBulk = genForm.bulk && genForm.count > 1;
      const endpoint = isBulk ? 'bulk-create' : 'create';
      const body = isBulk
        ? {
            count: genForm.count,
            assignedState: genForm.assignedState || undefined,
            assignedTrade: genForm.assignedTrade || undefined,
            expiresAt: genForm.expiresAt || undefined,
          }
        : {
            assignedName: genForm.assignedName || undefined,
            assignedEmail: genForm.assignedEmail || undefined,
            assignedPhone: genForm.assignedPhone || undefined,
            assignedState: genForm.assignedState || undefined,
            assignedTrade: genForm.assignedTrade || undefined,
            expiresAt: genForm.expiresAt || undefined,
          };

      const res = await fetch(`${API_BASE}/api/invite-codes/${endpoint}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate code');
      const qty = data.count || 1;
      setGenMsg(`✅ ${qty} code${qty > 1 ? 's' : ''} generated successfully.`);
      setGenForm({
        assignedName: '', assignedEmail: '', assignedPhone: '',
        assignedState: '', assignedTrade: '', expiresAt: '', count: 1, bulk: false,
      });
      loadCodes();
    } catch (err) {
      setGenMsg(`❌ ${err.message}`);
    } finally {
      setGenLoading(false);
    }
  }

  // ── Revoke a code ─────────────────────────────────────────────────────────
  async function handleRevoke(code) {
    if (!window.confirm(`Revoke code ${code}? This cannot be undone.`)) return;
    setRevokeLoading(code);
    try {
      const res = await fetch(`${API_BASE}/api/invite-codes/revoke`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadCodes();
    } catch (err) {
      alert(err.message);
    } finally {
      setRevokeLoading('');
    }
  }

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="container-xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Fixlo Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Internal admin panel — private access only</p>
        </div>
        <Link to="/dashboard/admin" className="text-sm text-blue-600 hover:underline">
          ↗ Full Admin Panel
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'invite-codes', label: '🎟 Invitation Codes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ───────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Platform Overview</h2>
            <button onClick={loadOverview} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
          </div>

          {overviewLoading ? (
            <div className="text-center py-10 text-slate-400">Loading metrics…</div>
          ) : overview ? (
            <>
              {/* Primary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard label="Total Pros" value={overview.totalPros} />
                <StatCard label="Active Pros" value={overview.activePros} color="text-green-700" />
                <StatCard label="Leads Today" value={overview.leadsToday} color="text-blue-700" />
                <StatCard label="Revenue (Month)" value={`$${(overview.totalRevenueMonth || 0).toFixed(2)}`} color="text-indigo-700" />
              </div>

              {/* Invite code stats panel (lazy loaded) */}
              <InviteCodeSummaryPanel />

              {/* Admin sub-links */}
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                {[
                  { to: '/dashboard/admin/jobs', icon: '📋', label: 'Job Control Center', desc: 'Manage jobs, schedules, and payments' },
                  { to: '/dashboard/admin/lead-hunter', icon: '🤖', label: 'AI Lead Hunter', desc: 'AI-powered lead detection' },
                  { to: '/dashboard/admin/seo-ai', icon: '🔍', label: 'SEO AI Engine', desc: 'Automated SEO content generation' },
                  { to: '/dashboard/admin/social', icon: '📱', label: 'Social Media Manager', desc: 'Connect and manage social accounts' },
                  { to: '/dashboard/admin/settings', icon: '⚙️', label: 'Admin Settings', desc: 'Configure integrations and settings' },
                  { to: '/admin/recruiters', icon: '🤝', label: 'Recruiter Network', desc: 'Manage recruiters and commissions' },
                ].map((card) => (
                  <Link
                    key={card.to}
                    to={card.to}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="text-xl mb-1">
                      {card.icon}{' '}
                      <span className="text-base font-bold text-slate-800">{card.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{card.desc}</p>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-sm">Could not load overview. Is the backend running?</div>
          )}
        </div>
      )}

      {/* ── TAB: Invitation Codes ────────────────────────────────────────────── */}
      {activeTab === 'invite-codes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Invitation Codes</h2>
            <button onClick={loadCodes} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
          </div>

          {/* Summary counts */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <StatCard label="Total Codes" value={summary.total} />
              <StatCard label="Pending" value={summary.pending} color="text-yellow-700" />
              <StatCard label="Redeemed" value={summary.redeemed} color="text-green-700" />
              <StatCard label="Expired" value={summary.expired} color="text-slate-500" />
              <StatCard label="Revoked" value={summary.revoked} color="text-red-600" />
            </div>
          )}

          {/* Generate form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Generate Invitation Code</h3>
            <form onSubmit={handleGenerate} className="space-y-3">
              {/* Bulk toggle */}
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={genForm.bulk}
                    onChange={(e) => setGenForm((p) => ({ ...p, bulk: e.target.checked }))}
                    className="rounded"
                  />
                  Generate multiple codes
                </label>
                {genForm.bulk && (
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={genForm.count}
                    onChange={(e) => setGenForm((p) => ({ ...p, count: parseInt(e.target.value) || 1 }))}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    placeholder="Qty"
                  />
                )}
              </div>

              {/* Assignment fields — hidden in bulk mode */}
              {!genForm.bulk && (
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Assigned Name</label>
                    <input
                      value={genForm.assignedName}
                      onChange={(e) => setGenForm((p) => ({ ...p, assignedName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      placeholder="Full name (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Assigned Email</label>
                    <input
                      type="email"
                      value={genForm.assignedEmail}
                      onChange={(e) => setGenForm((p) => ({ ...p, assignedEmail: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      placeholder="email@example.com (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Assigned Phone</label>
                    <input
                      type="tel"
                      value={genForm.assignedPhone}
                      onChange={(e) => setGenForm((p) => ({ ...p, assignedPhone: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      placeholder="+1XXXXXXXXXX (optional)"
                    />
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">State</label>
                  <input
                    value={genForm.assignedState}
                    onChange={(e) => setGenForm((p) => ({ ...p, assignedState: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    placeholder="e.g. NC (optional)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Trade / Service</label>
                  <input
                    value={genForm.assignedTrade}
                    onChange={(e) => setGenForm((p) => ({ ...p, assignedTrade: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    placeholder="e.g. Plumbing (optional)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={genForm.expiresAt}
                    onChange={(e) => setGenForm((p) => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={genLoading}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {genLoading
                  ? 'Generating…'
                  : genForm.bulk && genForm.count > 1
                  ? `Generate ${genForm.count} Codes`
                  : 'Generate Code'}
              </button>

              {genMsg && (
                <p className={`text-sm mt-1 ${genMsg.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
                  {genMsg}
                </p>
              )}
            </form>
          </div>

          {/* Search & filter */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadCodes()}
              placeholder="Search by code, name, email, phone…"
              className="flex-1 min-w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
            <button
              onClick={loadCodes}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Codes table */}
          {codesLoading ? (
            <div className="text-center py-10 text-slate-400">Loading codes…</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-10 text-slate-400">No invitation codes found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    {['Code', 'Status', 'Assigned To', 'Trade / State', 'Plan', 'Expires', 'Redeemed By', 'Redeemed At', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
                      {/* Code + copy button */}
                      <td className="px-3 py-2 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          {c.code}
                          <button
                            onClick={() => copyCode(c.code)}
                            title="Copy code"
                            className="text-slate-400 hover:text-slate-700 ml-1"
                          >
                            {copiedCode === c.code ? '✅' : '📋'}
                          </button>
                        </span>
                      </td>
                      {/* Status — uses the virtual 'status' field from the API */}
                      <td className="px-3 py-2">
                        <StatusBadge status={c.status || 'pending'} />
                      </td>
                      {/* Assigned to */}
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                        <div>{c.assignedName || '—'}</div>
                        {c.assignedEmail && <div className="text-xs text-slate-500">{c.assignedEmail}</div>}
                        {c.assignedPhone && <div className="text-xs text-slate-500">{c.assignedPhone}</div>}
                      </td>
                      {/* Trade / State */}
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {[c.assignedTrade, c.assignedState].filter(Boolean).join(' / ') || '—'}
                      </td>
                      {/* Plan */}
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {c.planType === 'one-year-free' ? '🎉 1-Year Free' : c.planType}
                      </td>
                      {/* Expires */}
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                      </td>
                      {/* Redeemed by */}
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {c.redeemedByUserId
                          ? (
                              typeof c.redeemedByUserId === 'object'
                                ? (c.redeemedByUserId.name || c.redeemedByUserId.email || String(c.redeemedByUserId._id))
                                : String(c.redeemedByUserId)
                            )
                          : '—'}
                      </td>
                      {/* Redeemed at */}
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {c.redeemedAt ? new Date(c.redeemedAt).toLocaleDateString() : '—'}
                      </td>
                      {/* Created */}
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {!c.redeemed && !c.revoked && (
                          <button
                            onClick={() => handleRevoke(c.code)}
                            disabled={revokeLoading === c.code}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            {revokeLoading === c.code ? 'Revoking…' : 'Revoke'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * InviteCodeSummaryPanel
 * Loads invite code summary counts to display inside the Overview tab.
 */
function InviteCodeSummaryPanel() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/invite-codes?limit=1`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary);
        }
      } catch (_) {
        // non-blocking
      }
    }
    load();
  }, []);

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-4">
      <StatCard label="Invite Codes (Total)" value={summary.total} />
      <StatCard label="Pending Codes" value={summary.pending} color="text-yellow-700" />
      <StatCard label="Redeemed Codes" value={summary.redeemed} color="text-green-700" />
      <StatCard label="Expired Codes" value={summary.expired} color="text-slate-500" />
      <StatCard label="Revoked Codes" value={summary.revoked} color="text-red-600" />
    </div>
  );
}
