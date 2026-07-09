import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/config';

// ── Helpers ──────────────────────────────────────────────────────────────────

const adminToken = () =>
  localStorage.getItem('fixlo_token') || localStorage.getItem('fixlo_admin_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: adminToken() ? 'Bearer ' + adminToken() : ''
});

const STATUS_STYLE = {
  active:   'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  disabled: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  redeemed: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  expired:  'bg-red-500/20 text-red-300 border border-red-500/30',
  revoked:  'bg-slate-500/20 text-slate-400 border border-slate-500/30'
};

const DURATION_LABELS = {
  '30days':   '30 Days',
  '90days':   '90 Days',
  '6months':  '6 Months',
  '12months': '12 Months',
  'unlimited':'Unlimited'
};

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MetricBox({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const DEFAULT_CREATE_FORM = {
  assignedName: '',
  assignedEmail: '',
  assignedPhone: '',
  assignedState: '',
  assignedTrade: '',
  membershipDuration: '12months',
  usesAllowed: '1',
  expiresAt: '',
  notes: '',
  count: '1'
};

export default function AdminInviteCodesPage() {
  const navigate = useNavigate();

  // List state
  const [codes, setCodes] = useState([]);
  const [summary, setSummary] = useState({});
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Recruiter requests state
  const [codeRequests, setCodeRequests] = useState([]);
  const [reqSummary, setReqSummary] = useState({});
  const [reqLoading, setReqLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('codes'); // 'codes' | 'requests'

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState(null); // code object
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // ── Data loading ─────────────────────────────────────────────────────────────

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 25,
        sort,
        order,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(durationFilter && { membershipDuration: durationFilter })
      });
      const res = await fetch(`${API_BASE}/api/invite-codes?${params}`, { headers: authHeaders() });
      if (res.status === 401) { navigate('/login/pro'); return; }
      const data = await res.json();
      if (data.ok) {
        setCodes(data.invites || []);
        setSummary(data.summary || {});
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load codes:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sort, order, search, statusFilter, durationFilter, navigate]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/invite-codes/stats`, { headers: authHeaders() });
      const data = await res.json();
      if (data.ok) setStats(data.stats);
    } catch { /* silent */ }
  }, []);

  const loadCodeRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/code-requests?limit=50`, { headers: authHeaders() });
      const data = await res.json();
      if (data.ok) {
        setCodeRequests(data.requests || []);
        setReqSummary(data.summary || {});
      }
    } catch { /* silent */ }
    finally { setReqLoading(false); }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'requests') loadCodeRequests();
  }, [activeTab, loadCodeRequests]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const isBulk = parseInt(createForm.count) > 1;
      const endpoint = isBulk ? '/api/invite-codes/bulk-create' : '/api/invite-codes/create';
      const payload = isBulk
        ? {
            count: parseInt(createForm.count),
            assignedState: createForm.assignedState || undefined,
            assignedTrade: createForm.assignedTrade || undefined,
            membershipDuration: createForm.membershipDuration,
            usesAllowed: parseInt(createForm.usesAllowed) || 1,
            expiresAt: createForm.expiresAt || undefined,
            notes: createForm.notes || undefined
          }
        : {
            assignedName: createForm.assignedName || undefined,
            assignedEmail: createForm.assignedEmail || undefined,
            assignedPhone: createForm.assignedPhone || undefined,
            assignedState: createForm.assignedState || undefined,
            assignedTrade: createForm.assignedTrade || undefined,
            membershipDuration: createForm.membershipDuration,
            usesAllowed: parseInt(createForm.usesAllowed) || 1,
            expiresAt: createForm.expiresAt || undefined,
            notes: createForm.notes || undefined
          };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) { setCreateError(data.error || 'Failed to create code'); return; }
      setShowCreate(false);
      setCreateForm(DEFAULT_CREATE_FORM);
      loadCodes();
      loadStats();
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (action, code) => {
    const confirmMsg = {
      disable: `Disable code ${code}?`,
      enable:  `Re-enable code ${code}?`,
      revoke:  `Permanently revoke code ${code}? This cannot be undone.`,
      duplicate: `Duplicate settings of code ${code} into a new code?`
    }[action];
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    try {
      if (action === 'delete') {
        const invite = codes.find(c => c.code === code);
        const res = await fetch(`${API_BASE}/api/invite-codes/${invite._id}`, {
          method: 'DELETE',
          headers: authHeaders()
        });
        const data = await res.json();
        if (!data.ok) { alert(data.error); return; }
      } else {
        const res = await fetch(`${API_BASE}/api/invite-codes/${action}`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (!data.ok) { alert(data.error); return; }
        if (action === 'duplicate' && data.invite) {
          alert(`New code created: ${data.invite.code}`);
        }
      }
      loadCodes();
      loadStats();
    } catch {
      alert('Action failed. Please try again.');
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams({
      ...(statusFilter && { status: statusFilter }),
      ...(durationFilter && { membershipDuration: durationFilter })
    });
    const url = `${API_BASE}/api/invite-codes/export?${params}`;
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) { alert('Export failed'); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `fixlo-invite-codes-${Date.now()}.csv`;
      a.click();
    } catch {
      alert('Export failed. Please try again.');
    }
  };

  const handleReviewRequest = async (reqId, action, generateCode = false) => {
    const adminNotes = action === 'reject'
      ? window.prompt('Reason for rejection (optional):') || ''
      : '';
    try {
      const res = await fetch(`${API_BASE}/api/admin/code-requests/${reqId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ action, adminNotes, generateCode })
      });
      const data = await res.json();
      if (!data.ok && data.error) { alert(data.error); return; }
      if (data.generatedInvite) {
        alert(`Request approved! Generated code: ${data.generatedInvite.code}`);
      }
      loadCodeRequests();
      loadCodes();
      loadStats();
    } catch {
      alert('Action failed. Please try again.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const LIMIT = 25;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Invitation Code Management</h1>
          <p className="text-slate-400 text-sm mt-1">Generate, manage, and track promotional invitation codes</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Generate Code
          </button>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <MetricBox label="Total Codes" value={summary.total ?? 0} />
          <MetricBox label="Active" value={summary.active ?? 0} color="text-emerald-400" />
          <MetricBox label="Redeemed" value={summary.redeemed ?? 0} color="text-blue-400" />
          <MetricBox label="Expired" value={summary.expired ?? 0} color="text-red-400" />
          <MetricBox label="Disabled/Revoked" value={(summary.disabled ?? 0) + (summary.revoked ?? 0)} color="text-slate-400" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 mb-6">
        {['codes', 'requests'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'requests' ? `Code Requests${reqSummary.pending ? ` (${reqSummary.pending})` : ''}` : 'Invite Codes'}
          </button>
        ))}
      </div>

      {/* ── Codes Tab ── */}
      {activeTab === 'codes' && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search codes, names, emails…"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              <option value="">All Statuses</option>
              {['active','disabled','redeemed','expired','revoked'].map(s => (
                <option key={s} value={s} className="bg-slate-900 capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>
              ))}
            </select>
            <select
              value={durationFilter}
              onChange={e => { setDurationFilter(e.target.value); setPage(1); }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              <option value="">All Durations</option>
              {Object.entries(DURATION_LABELS).map(([v,l]) => (
                <option key={v} value={v} className="bg-slate-900">{l}</option>
              ))}
            </select>
            <select
              value={`${sort}:${order}`}
              onChange={e => { const [s,o]=e.target.value.split(':'); setSort(s); setOrder(o); setPage(1); }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              <option value="createdAt:desc" className="bg-slate-900">Newest First</option>
              <option value="createdAt:asc" className="bg-slate-900">Oldest First</option>
              <option value="expiresAt:asc" className="bg-slate-900">Expires Soon</option>
              <option value="code:asc" className="bg-slate-900">Code A→Z</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Uses</th>
                    <th className="px-4 py-3 text-left">Assigned</th>
                    <th className="px-4 py-3 text-left">Expires</th>
                    <th className="px-4 py-3 text-left">Redeemed</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
                  ) : codes.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No codes found.</td></tr>
                  ) : codes.map((code) => (
                    <tr key={code._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-blue-300">{code.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[code.status] || STATUS_STYLE.revoked}`}>
                          {code.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {DURATION_LABELS[code.membershipDuration] || code.membershipDuration || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {code.usesAllowed === 0 ? '∞' : `${code.usesRemaining}/${code.usesAllowed}`}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {code.assignedName || code.assignedEmail || code.assignedPhone
                          ? [code.assignedName, code.assignedEmail, code.assignedState].filter(Boolean).join(' · ')
                          : <span className="text-slate-500">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{fmt(code.expiresAt)}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {code.redeemedByList?.length > 0
                          ? <button onClick={() => setShowHistory(code)} className="text-blue-400 hover:underline">{code.redeemedByList.length} use{code.redeemedByList.length !== 1 ? 's' : ''}</button>
                          : <span className="text-slate-500">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {code.status === 'active' && (
                            <button onClick={() => handleAction('disable', code.code)} className="px-2 py-1 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 text-xs rounded transition-colors">Disable</button>
                          )}
                          {code.status === 'disabled' && (
                            <button onClick={() => handleAction('enable', code.code)} className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs rounded transition-colors">Enable</button>
                          )}
                          {!['redeemed','revoked'].includes(code.status) && (
                            <button onClick={() => handleAction('revoke', code.code)} className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs rounded transition-colors">Revoke</button>
                          )}
                          <button onClick={() => handleAction('duplicate', code.code)} className="px-2 py-1 bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 text-xs rounded transition-colors">Duplicate</button>
                          {!code.redeemed && !(code.redeemedByList?.length) && (
                            <button onClick={() => handleAction('delete', code.code)} className="px-2 py-1 bg-red-800/30 hover:bg-red-800/50 text-red-400 text-xs rounded transition-colors">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{total} total code{total !== 1 ? 's' : ''}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 bg-white/10 rounded disabled:opacity-40">←</button>
              <span className="px-3 py-1">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 bg-white/10 rounded disabled:opacity-40">→</button>
            </div>
          </div>

          {/* Recent redemptions */}
          {stats?.recentRedemptions?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Redemptions</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Duration</th>
                      <th className="px-4 py-3 text-left">Pro</th>
                      <th className="px-4 py-3 text-left">Redeemed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentRedemptions.map((c) => (
                      <tr key={c._id} className="border-b border-white/5">
                        <td className="px-4 py-3 font-mono text-blue-300">{c.code}</td>
                        <td className="px-4 py-3 text-slate-300">{DURATION_LABELS[c.membershipDuration] || '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{c.redeemedByUserId?.name || c.redeemedBy || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{fmt(c.redeemedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Code Requests Tab ── */}
      {activeTab === 'requests' && (
        <div>
          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-slate-300">Pending: <strong className="text-yellow-400">{reqSummary.pending || 0}</strong></span>
            <span className="text-slate-300">Approved: <strong className="text-emerald-400">{reqSummary.approved || 0}</strong></span>
            <span className="text-slate-300">Rejected: <strong className="text-red-400">{reqSummary.rejected || 0}</strong></span>
          </div>
          {reqLoading ? (
            <p className="text-slate-400">Loading requests…</p>
          ) : codeRequests.length === 0 ? (
            <p className="text-slate-400">No recruiter code requests yet.</p>
          ) : (
            <div className="space-y-3">
              {codeRequests.map((req) => (
                <div key={req._id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>{req.status}</span>
                        <span className="text-slate-400 text-xs">{fmt(req.createdAt)}</span>
                      </div>
                      <p className="text-white font-medium">{req.requesterName} <span className="text-slate-400 text-sm">({req.requesterEmail})</span></p>
                      <p className="text-slate-300 text-sm mt-1"><strong>Requested:</strong> {DURATION_LABELS[req.requestedDuration] || req.requestedDuration}</p>
                      <p className="text-slate-300 text-sm"><strong>Reason:</strong> {req.reason}</p>
                      {req.targetName && <p className="text-slate-400 text-xs mt-1">Target: {[req.targetName, req.targetEmail, req.targetState, req.targetTrade].filter(Boolean).join(' · ')}</p>}
                      {req.adminNotes && <p className="text-slate-400 text-xs mt-1">Admin note: {req.adminNotes}</p>}
                      {req.generatedCode && <p className="text-emerald-400 text-xs mt-1">Generated code: <span className="font-mono">{req.generatedCode}</span></p>}
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleReviewRequest(req._id, 'approve', true)}
                          className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs rounded transition-colors"
                        >
                          Approve + Generate Code
                        </button>
                        <button
                          onClick={() => handleReviewRequest(req._id, 'approve', false)}
                          className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs rounded transition-colors"
                        >
                          Approve Only
                        </button>
                        <button
                          onClick={() => handleReviewRequest(req._id, 'reject', false)}
                          className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs rounded transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Create Code Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Generate Invitation Code</h2>
            {createError && (
              <div className="mb-4 bg-red-500/20 border border-red-400/40 rounded-lg p-3 text-red-200 text-sm">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">Quantity</label>
                <input type="number" min="1" max="100" value={createForm.count}
                  onChange={e => setCreateForm(f=>({...f,count:e.target.value}))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Membership Duration</label>
                <select value={createForm.membershipDuration}
                  onChange={e => setCreateForm(f=>({...f,membershipDuration:e.target.value}))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                  {Object.entries(DURATION_LABELS).map(([v,l]) => (
                    <option key={v} value={v} className="bg-slate-900">{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Max Uses <span className="text-slate-500">(0 = unlimited)</span></label>
                <input type="number" min="0" value={createForm.usesAllowed}
                  onChange={e => setCreateForm(f=>({...f,usesAllowed:e.target.value}))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Code Expiration Date</label>
                <input type="date" value={createForm.expiresAt}
                  onChange={e => setCreateForm(f=>({...f,expiresAt:e.target.value}))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              {parseInt(createForm.count) === 1 && (
                <>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-slate-400 text-xs mb-3">Optional: Restrict this code to a specific person</p>
                    <div className="space-y-3">
                      <input placeholder="Full name" value={createForm.assignedName}
                        onChange={e => setCreateForm(f=>({...f,assignedName:e.target.value}))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none text-sm" />
                      <input placeholder="Email address" type="email" value={createForm.assignedEmail}
                        onChange={e => setCreateForm(f=>({...f,assignedEmail:e.target.value}))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none text-sm" />
                      <input placeholder="Phone number" type="tel" value={createForm.assignedPhone}
                        onChange={e => setCreateForm(f=>({...f,assignedPhone:e.target.value}))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none text-sm" />
                      <input placeholder="State (e.g. TX)" value={createForm.assignedState}
                        onChange={e => setCreateForm(f=>({...f,assignedState:e.target.value}))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none text-sm" />
                      <input placeholder="Trade (e.g. plumbing)" value={createForm.assignedTrade}
                        onChange={e => setCreateForm(f=>({...f,assignedTrade:e.target.value}))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none text-sm" />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-slate-300 text-sm mb-1">Internal Notes</label>
                <textarea value={createForm.notes} rows={2}
                  onChange={e => setCreateForm(f=>({...f,notes:e.target.value}))}
                  placeholder="Optional admin notes…"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm">
                  {creating ? 'Generating…' : `Generate ${parseInt(createForm.count) > 1 ? parseInt(createForm.count) + ' Codes' : 'Code'}`}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(''); }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Redemption History Modal ── */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Redemption History</h2>
              <button onClick={() => setShowHistory(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="font-mono text-blue-300 text-lg mb-4">{showHistory.code}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Duration: <strong className="text-white">{DURATION_LABELS[showHistory.membershipDuration] || '—'}</strong></span>
                <span>Expires: <strong className="text-white">{fmt(showHistory.expiresAt)}</strong></span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Uses Allowed: <strong className="text-white">{showHistory.usesAllowed === 0 ? '∞' : showHistory.usesAllowed}</strong></span>
                <span>Remaining: <strong className="text-white">{showHistory.usesAllowed === 0 ? '∞' : showHistory.usesRemaining}</strong></span>
              </div>
              {showHistory.notes && (
                <p className="text-slate-400 italic">"{showHistory.notes}"</p>
              )}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <h3 className="text-white font-semibold mb-3">Redemptions ({showHistory.redeemedByList?.length || 0})</h3>
              {!showHistory.redeemedByList?.length ? (
                <p className="text-slate-500 text-sm">No redemptions yet.</p>
              ) : (
                <div className="space-y-2">
                  {showHistory.redeemedByList.map((r, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <p className="text-white text-sm">{r.proName || '—'}</p>
                      <p className="text-slate-400 text-xs">{r.proEmail} · {r.proPhone}</p>
                      <p className="text-slate-500 text-xs">{fmt(r.redeemedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
