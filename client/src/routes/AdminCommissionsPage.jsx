import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import HelmetSEO from '../seo/HelmetSEO';

function fmt(cents) {
  return '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

const STATUS_OPTIONS = ['pending', 'held', 'approved', 'paid', 'cancelled', 'refunded', 'fraud_review'];
const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  held: 'bg-orange-500/20 text-orange-300',
  approved: 'bg-teal-500/20 text-teal-300',
  paid: 'bg-green-500/20 text-green-300',
  cancelled: 'bg-gray-500/20 text-gray-400',
  refunded: 'bg-red-500/20 text-red-300',
  fraud_review: 'bg-red-700/30 text-red-300'
};

export default function AdminCommissionsPage() {
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const adminToken = localStorage.getItem('fixlo_token') || localStorage.getItem('fixlo_admin_token');
  const headers = { 'Content-Type': 'application/json', Authorization: adminToken ? 'Bearer ' + adminToken : '' };

  useEffect(() => { loadCommissions(); }, [filterStatus, page]);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(filterStatus && { status: filterStatus }) });
      const res = await fetch(`${API_BASE}/api/admin/recruiter-commissions?${params}`, { headers });
      if (res.status === 401) { navigate('/pro/sign-in'); return; }
      const data = await res.json();
      if (data.ok) { setCommissions(data.commissions); setTotal(data.total); }
    } finally { setLoading(false); }
  };

  const openEdit = (c) => {
    setEditing(c);
    setEditStatus(c.status);
    setEditNotes(c.adminNotes || '');
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/admin/recruiter-commissions/${editing._id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: editStatus, adminNotes: editNotes })
      });
      setEditing(null);
      loadCommissions();
    } finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <HelmetSEO title="Commission Admin | Fixlo" canonicalPathname="/admin/commissions" description="Admin: manage commissions" />
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
            <Link to="/dashboard/admin" className="text-white/50 hover:text-white">← Admin</Link>
            <span className="text-white/20">/</span>
            <span>Commissions</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold mb-6">Commission Management</h1>

          <div className="flex gap-3 mb-6">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none">
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div></div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-white/50 text-left">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Recruiter</th>
                    <th className="px-4 py-3 font-medium">Pro</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Hold Until</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {commissions.map(c => (
                    <tr key={c._id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white/60 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium">{c.recruiterId?.name || '—'}</div>
                        <div className="text-white/40 text-xs">{c.recruiterId?.recruiterCode}</div>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs">{c.referralId?.proEmail || '—'}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">L{c.level}</span></td>
                      <td className="px-4 py-3 font-bold text-blue-300">{fmt(c.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[c.status] || '')}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {c.holdUntil ? new Date(c.holdUntil).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(c)}
                          className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-1 rounded transition-colors">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-white/10 text-sm text-white/50">
                  <span>{total} total</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-white/10 disabled:opacity-40">Prev</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-white/10 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-md">
              <h2 className="font-bold text-lg mb-4">Edit Commission</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Admin Notes</label>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
