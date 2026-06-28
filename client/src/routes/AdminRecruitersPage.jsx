import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import HelmetSEO from '../seo/HelmetSEO';

function fmt(cents) {
  return '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-300',
  suspended: 'bg-red-500/20 text-red-300',
  pending_review: 'bg-yellow-500/20 text-yellow-300'
};

export default function AdminRecruitersPage() {
  const navigate = useNavigate();
  const [recruiters, setRecruiters] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const adminToken = localStorage.getItem('fixlo_token') || localStorage.getItem('fixlo_admin_token');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: adminToken ? 'Bearer ' + adminToken : ''
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadRecruiters();
  }, [search, status, page]);

  const loadRecruiters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(search && { search }), ...(status && { status }) });
      const res = await fetch(`${API_BASE}/api/admin/recruiters?${params}`, { headers: authHeaders });
      if (res.status === 401) { navigate('/pro/sign-in'); return; }
      const data = await res.json();
      if (data.ok) { setRecruiters(data.recruiters); setTotal(data.total); }
    } finally { setLoading(false); }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/recruiter-analytics`, { headers: authHeaders });
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics);
    } catch { /* silent */ }
  };

  const updateStatus = async (id, newStatus) => {
    await fetch(`${API_BASE}/api/admin/recruiters/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: newStatus })
    });
    loadRecruiters();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <HelmetSEO title="Recruiter Admin | Fixlo" canonicalPathname="/admin/recruiters" description="Admin: manage recruiters" />
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
            <Link to="/dashboard/admin" className="text-white/50 hover:text-white">← Admin</Link>
            <span className="text-white/20">/</span>
            <span>Recruiters</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold mb-6">Recruiter Network Admin</h1>

          {/* Analytics */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              {[
                ['Total Recruiters', analytics.totalRecruiters],
                ['Total Pros', analytics.totalPros],
                ['Monthly Commissions', fmt(analytics.monthlyCommissions)],
                ['Monthly Payouts', fmt(analytics.monthlyPayouts)],
                ['Avg Referrals/Recruiter', analytics.averageReferralsPerRecruiter]
              ].map(([label, val]) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white/50 text-xs mb-1">{label}</p>
                  <p className="text-xl font-bold text-blue-300">{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="search" placeholder="Search name, email, code…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-64" />
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending_review">Pending Review</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div></div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-white/50 text-left">
                    <th className="px-4 py-3 font-medium">Recruiter</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Referrals</th>
                    <th className="px-4 py-3 font-medium">Lifetime</th>
                    <th className="px-4 py-3 font-medium">Stripe</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recruiters.map(r => (
                    <tr key={r._id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-white/40 text-xs">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-300 font-bold text-xs">{r.recruiterCode}</td>
                      <td className="px-4 py-3 text-white/70">{r.totalReferrals || 0}</td>
                      <td className="px-4 py-3 text-green-300 font-semibold">{fmt(r.lifetimeCommissions)}</td>
                      <td className="px-4 py-3">
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (r.stripeConnectOnboarded ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400')}>
                          {r.stripeConnectOnboarded ? 'Connected' : 'Not connected'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[r.status] || '')}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'active' ? (
                          <button onClick={() => updateStatus(r._id, 'suspended')}
                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded transition-colors">
                            Suspend
                          </button>
                        ) : (
                          <button onClick={() => updateStatus(r._id, 'active')}
                            className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 px-2 py-1 rounded transition-colors">
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-white/10 text-sm text-white/50">
                  <span>{total} total</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                      className="px-3 py-1 rounded bg-white/10 disabled:opacity-40">Prev</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                      className="px-3 py-1 rounded bg-white/10 disabled:opacity-40">Next</button>
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
