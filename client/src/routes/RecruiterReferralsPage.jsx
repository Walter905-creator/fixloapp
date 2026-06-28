import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import HelmetSEO from '../seo/HelmetSEO';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  active: 'bg-green-500/20 text-green-300',
  paid: 'bg-blue-500/20 text-blue-300',
  cancelled: 'bg-red-500/20 text-red-300',
  fraud_review: 'bg-orange-500/20 text-orange-300'
};

function fmt(cents) {
  return '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export default function RecruiterReferralsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, authFetch, logout } = useRecruiterAuth();
  const [referrals, setReferrals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Code generation
  const [codes, setCodes] = useState([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/recruiter/login', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadReferrals();
    loadCodes();
  }, [isAuthenticated, page]);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/referrals?page=${page}&limit=20`);
      if (res.status === 401) { logout(); navigate('/recruiter/login'); return; }
      const data = await res.json();
      if (data.ok) { setReferrals(data.referrals); setTotal(data.total); }
    } finally { setLoading(false); }
  };

  const loadCodes = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/codes`);
      const data = await res.json();
      if (data.ok) setCodes(data.codes);
    } catch { /* silent */ }
  };

  const generateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/codes/generate`, {
        method: 'POST',
        body: JSON.stringify({ type: 'pro', expiresInDays: 30 })
      });
      const data = await res.json();
      if (data.ok) { setCodes(c => [data.code, ...c]); }
    } finally { setGeneratingCode(false); }
  };

  const deactivateCode = async (id) => {
    await authFetch(`${API_BASE}/api/recruiter/codes/${id}/deactivate`, { method: 'PATCH' });
    setCodes(c => c.map(x => x._id === id ? { ...x, isActive: false } : x));
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(key); setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <HelmetSEO title="My Pros | Fixlo Recruiter" canonicalPathname="/recruiter/referrals" description="Track your recruited professionals" />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-white">
        <div className="border-b border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/recruiter/dashboard" className="text-white/50 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-white/20">/</span>
            <span className="text-sm">My Pros</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold mb-6">My Recruited Pros</h1>

          {/* One-time codes */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-blue-200">One-Time Referral Codes</h2>
              <button onClick={generateCode} disabled={generatingCode}
                className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
                {generatingCode ? 'Generating…' : '+ Generate Code'}
              </button>
            </div>
            {codes.length === 0 ? (
              <p className="text-white/40 text-sm">No codes yet. Generate one to share with a specific pro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-left border-b border-white/10">
                      <th className="pb-2 font-medium">Code</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Expires</th>
                      <th className="pb-2 font-medium">Used By</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {codes.map(c => (
                      <tr key={c._id}>
                        <td className="py-2.5 font-mono text-blue-300 font-bold">{c.code}</td>
                        <td className="py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.isUsed ? 'bg-gray-500/20 text-gray-400' : c.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {c.isUsed ? 'Used' : c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2.5 text-white/50">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                        <td className="py-2.5 text-white/50">{c.usedBy || '—'}</td>
                        <td className="py-2.5">
                          <div className="flex gap-2">
                            <button onClick={() => copy(c.code, c._id + '-code')}
                              className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors">
                              {copiedCode === c._id + '-code' ? '✓' : 'Copy'}
                            </button>
                            {c.isActive && !c.isUsed && (
                              <button onClick={() => deactivateCode(c._id)}
                                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded transition-colors">
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Referrals table */}
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div></div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-lg font-semibold mb-2">No pros referred yet</p>
              <p className="text-sm">Share your referral link to start earning commissions.</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-white/50 text-left">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Trade</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Signup Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {referrals.map(r => (
                    <tr key={r._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium">{r.proName || r.proEmail}</td>
                      <td className="px-4 py-3 text-white/60">{r.proTrade || '—'}</td>
                      <td className="px-4 py-3 text-white/60">{r.proCity || '—'}</td>
                      <td className="px-4 py-3 text-white/60">{new Date(r.signupDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[r.status] || 'bg-gray-500/20 text-gray-400')}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-300">
                        {r.commission ? fmt(r.commission.amount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-white/10 text-sm text-white/50">
                  <span>Page {page} of {totalPages}</span>
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
