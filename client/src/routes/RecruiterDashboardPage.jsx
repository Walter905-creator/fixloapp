import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import HelmetSEO from '../seo/HelmetSEO';

function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue: 'from-blue-600 to-blue-800',
    green: 'from-emerald-600 to-emerald-800',
    yellow: 'from-amber-500 to-amber-700',
    purple: 'from-purple-600 to-purple-800',
    teal: 'from-teal-600 to-teal-800',
    red: 'from-red-600 to-red-800'
  };
  return (
    <div className={'rounded-2xl p-5 bg-gradient-to-br text-white shadow-lg ' + (colors[color] || colors.blue)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-extrabold mt-1">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
        </div>
        {icon && <span className="text-3xl opacity-40">{icon}</span>}
      </div>
    </div>
  );
}

function fmt(cents) {
  return '$' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RecruiterDashboardPage() {
  const navigate = useNavigate();
  const { recruiter, isAuthenticated, loading: authLoading, authFetch, logout } = useRecruiterAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/recruiter/login', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/me`);
      if (res.status === 401) { logout(); navigate('/recruiter/login'); return; }
      const json = await res.json();
      if (json.ok) setData(json);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authFetch, logout, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!isAuthenticated || !data) return null;

  const { stats, recruiter: rec } = data;

  return (
    <>
      <HelmetSEO title="Recruiter Dashboard | Fixlo" canonicalPathname="/recruiter/dashboard" description="Your Fixlo recruiter dashboard" />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-white">
        {/* Top nav */}
        <div className="border-b border-white/10 bg-white/5 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/fixlo-logo.png" alt="Fixlo" className="h-7" />
              <span className="text-white/40">|</span>
              <span className="text-sm font-semibold text-blue-300">Recruiter Network</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/60 hidden sm:block">{rec.email}</span>
              <button onClick={() => { logout(); navigate('/recruiter/login'); }}
                className="text-sm text-white/50 hover:text-white/80 transition-colors">Sign Out</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold">Welcome back, {rec.name}!</h1>
            <p className="text-white/50 mt-1">Recruiter Code: <span className="text-blue-400 font-mono font-bold">{rec.recruiterCode}</span></p>
          </div>

          {/* Referral Links */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="font-semibold mb-4 text-blue-200">Your Referral Links</h2>
            <div className="space-y-3">
              {[
                { label: 'Pro Signup Link', url: rec.recruiterLink, key: 'pro' },
                { label: 'Recruiter Signup Link', url: rec.recruiterRecruiterLink, key: 'rec' }
              ].map(({ label, url, key }) => (
                <div key={key} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/50 mb-0.5">{label}</p>
                    <p className="text-sm text-blue-300 font-mono truncate">{url}</p>
                  </div>
                  <button onClick={() => copy(url, key)}
                    className="shrink-0 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-blue-300 text-xs px-3 py-1.5 rounded-lg transition-colors">
                    {copied === key ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Total Pros Referred" value={stats.totalReferrals} icon="👥" color="blue" />
            <StatCard label="Active Pros" value={stats.activeReferrals} icon="✅" color="green" />
            <StatCard label="Recruiters Referred" value={stats.recruitersReferred} icon="🤝" color="purple" />
            <StatCard label="Pending" value={fmt(stats.pendingCommissions)} sub="Awaiting first payment" icon="⏳" color="yellow" />
            <StatCard label="Held" value={fmt(stats.heldCommissions)} sub="In verification period" icon="🔒" color="red" />
            <StatCard label="Available" value={fmt(stats.approvedCommissions)} sub="Ready for payout" icon="💰" color="teal" />
            <StatCard label="Paid" value={fmt(stats.paidCommissions)} sub="Paid out" icon="🏦" color="green" />
            <StatCard label="Lifetime Earnings" value={fmt(stats.lifetimeCommissions)} icon="🌟" color="purple" />
          </div>

          {/* Nav links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { to: '/recruiter/referrals', icon: '👥', label: 'My Pros' },
              { to: '/recruiter/recruiters', icon: '🤝', label: 'My Recruiters' },
              { to: '/recruiter/payments', icon: '💳', label: 'Payments' },
              { to: '/recruiter/settings', icon: '⚙️', label: 'Settings' }
            ].map(({ to, icon, label }) => (
              <Link key={to} to={to}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition-colors group">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-sm font-semibold text-white/80 group-hover:text-white">{label}</div>
              </Link>
            ))}
          </div>

          {/* Stripe Connect CTA */}
          {!rec.stripeConnectOnboarded && (
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-amber-300 mb-1">Connect your bank account to receive payouts</h3>
                <p className="text-amber-200/70 text-sm">You need to complete Stripe Connect setup before you can receive commissions.</p>
              </div>
              <Link to="/recruiter/settings"
                className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                Set Up Payouts →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
