import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import HelmetSEO from '../seo/HelmetSEO';

function fmt(cents) {
  return '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

const COMMISSION_STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  held: 'bg-orange-500/20 text-orange-300',
  approved: 'bg-teal-500/20 text-teal-300',
  paid: 'bg-green-500/20 text-green-300',
  cancelled: 'bg-gray-500/20 text-gray-400',
  refunded: 'bg-red-500/20 text-red-300',
  fraud_review: 'bg-red-700/30 text-red-300'
};

const PAYOUT_STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  processing: 'bg-blue-500/20 text-blue-300',
  paid: 'bg-green-500/20 text-green-300',
  failed: 'bg-red-500/20 text-red-300'
};

export default function RecruiterPaymentsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, authFetch, logout } = useRecruiterAuth();
  const [tab, setTab] = useState('commissions');
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/recruiter/login', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        authFetch(`${API_BASE}/api/recruiter/commissions?limit=50`),
        authFetch(`${API_BASE}/api/recruiter/payouts?limit=50`)
      ]);
      if (cRes.status === 401) { logout(); navigate('/recruiter/login'); return; }
      const [cData, pData] = await Promise.all([cRes.json(), pRes.json()]);
      if (cData.ok) setCommissions(cData.commissions);
      if (pData.ok) setPayouts(pData.payouts);
    } finally { setLoading(false); }
  };

  return (
    <>
      <HelmetSEO title="Payments | Fixlo Recruiter" canonicalPathname="/recruiter/payments" description="View your commissions and payouts" />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-white">
        <div className="border-b border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/recruiter/dashboard" className="text-white/50 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-white/20">/</span>
            <span className="text-sm">Payments</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold mb-6">Payment History</h1>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 w-fit">
            {['commissions', 'payouts'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={'px-4 py-2 rounded-lg text-sm font-semibold transition-colors ' + (tab === t ? 'bg-blue-500 text-white' : 'text-white/50 hover:text-white')}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div></div>
          ) : tab === 'commissions' ? (
            commissions.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <div className="text-5xl mb-4">💰</div>
                <p className="text-lg font-semibold">No commissions yet</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-white/50 text-left">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Pro</th>
                      <th className="px-4 py-3 font-medium">Level</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {commissions.map(c => (
                      <tr key={c._id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white/60">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-white/80">{c.referralId?.proEmail || '—'}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">Level {c.level}</span></td>
                        <td className="px-4 py-3 font-bold text-blue-300">{fmt(c.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={'text-xs px-2 py-0.5 rounded-full ' + (COMMISSION_STATUS_COLORS[c.status] || '')}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/40 text-xs">
                          {c.status === 'held' ? new Date(c.holdUntil).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            payouts.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <div className="text-5xl mb-4">🏦</div>
                <p className="text-lg font-semibold">No payouts yet</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-white/50 text-left">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Stripe Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payouts.map(p => (
                      <tr key={p._id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white/60">{new Date(p.payoutDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-bold text-green-300">{fmt(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={'text-xs px-2 py-0.5 rounded-full ' + (PAYOUT_STATUS_COLORS[p.status] || '')}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-white/40 text-xs">{p.stripeTransferId || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
