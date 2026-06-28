import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import HelmetSEO from '../seo/HelmetSEO';

function fmt(cents) {
  return '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  processing: 'bg-blue-500/20 text-blue-300',
  paid: 'bg-green-500/20 text-green-300',
  failed: 'bg-red-500/20 text-red-300'
};

export default function AdminPayoutsPage() {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const adminToken = localStorage.getItem('fixlo_token') || localStorage.getItem('fixlo_admin_token');
  const headers = { 'Content-Type': 'application/json', Authorization: adminToken ? 'Bearer ' + adminToken : '' };

  useEffect(() => { loadPayouts(); }, [filterStatus, page]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(filterStatus && { status: filterStatus }) });
      const res = await fetch(`${API_BASE}/api/admin/recruiter-payouts?${params}`, { headers });
      if (res.status === 401) { navigate('/pro/sign-in'); return; }
      const data = await res.json();
      if (data.ok) { setPayouts(data.payouts); setTotal(data.total); }
    } finally { setLoading(false); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <HelmetSEO title="Payouts Admin | Fixlo" canonicalPathname="/admin/payouts" description="Admin: manage recruiter payouts" />
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
            <Link to="/dashboard/admin" className="text-white/50 hover:text-white">← Admin</Link>
            <span className="text-white/20">/</span>
            <span>Payouts</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold mb-6">Recruiter Payouts</h1>

          <div className="flex gap-3 mb-6">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none">
              <option value="">All Statuses</option>
              {['pending', 'processing', 'paid', 'failed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div></div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <div className="text-5xl mb-4">🏦</div>
              <p>No payouts found</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-white/50 text-left">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Recruiter</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Stripe Transfer</th>
                    <th className="px-4 py-3 font-medium">Failure Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.map(p => (
                    <tr key={p._id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white/60">{new Date(p.payoutDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{p.recruiterId?.name || '—'}</div>
                        <div className="text-white/40 text-xs">{p.recruiterId?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-green-300">{fmt(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[p.status] || '')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-white/40 text-xs">{p.stripeTransferId || '—'}</td>
                      <td className="px-4 py-3 text-red-300 text-xs">{p.failureReason || '—'}</td>
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
      </div>
    </>
  );
}
