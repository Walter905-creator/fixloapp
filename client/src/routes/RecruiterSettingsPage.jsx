import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import HelmetSEO from '../seo/HelmetSEO';

export default function RecruiterSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { recruiter: authRecruiter, isAuthenticated, loading: authLoading, authFetch, logout, login, token } = useRecruiterAuth();

  const [profile, setProfile] = useState(null);
  const [sms, setSms] = useState({ referrals: true, commissions: true, payouts: true, fraud: true, weeklySummary: true });
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/recruiter/login', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadProfile();
    // Handle return from Stripe Connect
    if (searchParams.get('connect_return')) verifyConnect();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/me`);
      if (res.status === 401) { logout(); navigate('/recruiter/login'); return; }
      const data = await res.json();
      if (data.ok) {
        setProfile(data.recruiter);
        setSms(data.recruiter.smsNotifications || sms);
        setPhone(data.recruiter.phoneNumber || '');
      }
    } finally { setLoading(false); }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ smsNotifications: sms, phoneNumber: phone })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      setSuccess('Settings saved!');
      setProfile(data.recruiter);
      // Update stored recruiter
      login(token, { ...authRecruiter, ...data.recruiter });
    } finally { setSaving(false); }
  };

  const startConnect = async () => {
    setConnectLoading(true); setError('');
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/stripe-connect/onboard`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to start onboarding'); return; }
      window.location.href = data.url;
    } finally { setConnectLoading(false); }
  };

  const verifyConnect = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/stripe-connect/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setConnectStatus(data.onboarded ? 'Stripe Connect verified! You can now receive payouts.' : 'Onboarding incomplete. Please complete all required fields.');
        await loadProfile();
      }
    } catch { /* silent */ }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <>
      <HelmetSEO title="Settings | Fixlo Recruiter" canonicalPathname="/recruiter/settings" description="Manage your recruiter settings" />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-white">
        <div className="border-b border-white/10 bg-white/5">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/recruiter/dashboard" className="text-white/50 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-white/20">/</span>
            <span className="text-sm">Settings</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <h1 className="text-2xl font-extrabold">Account Settings</h1>

          {/* Payout Setup */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-2">Payout Settings</h2>
            <p className="text-white/50 text-sm mb-4">Connect your bank account to receive weekly commission payouts via Stripe Connect.</p>

            {connectStatus && (
              <div className="mb-4 bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 text-blue-200 text-sm">{connectStatus}</div>
            )}

            {profile?.stripeConnectOnboarded ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                <div>
                  <p className="font-semibold text-green-300">Bank account connected</p>
                  <p className="text-white/40 text-xs">Payout status: {profile.payoutStatus}</p>
                </div>
              </div>
            ) : (
              <button onClick={startConnect} disabled={connectLoading}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60">
                {connectLoading ? 'Redirecting…' : 'Connect Bank Account'}
              </button>
            )}
          </div>

          {/* SMS Settings */}
          <form onSubmit={saveSettings} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">Notification Preferences</h2>

            <div className="mb-4">
              <label className="block text-white/70 text-sm font-medium mb-1">Phone Number (for SMS)</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="+1 (555) 000-0000" />
            </div>

            <div className="space-y-3 mb-6">
              {[
                ['referrals', 'New referral notifications'],
                ['commissions', 'Commission notifications'],
                ['payouts', 'Payout notifications'],
                ['fraud', 'Fraud alert notifications'],
                ['weeklySummary', 'Weekly SMS summary (Mondays)']
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-white/80 text-sm">{label}</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={sms[key] || false}
                      onChange={e => setSms(s => ({ ...s, [key]: e.target.checked }))} />
                    <div className={'w-11 h-6 rounded-full transition-colors ' + (sms[key] ? 'bg-blue-500' : 'bg-white/20')}>
                      <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' + (sms[key] ? 'translate-x-5 left-0.5' : 'translate-x-0 left-0.5')} />
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {error && <div className="mb-3 bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-red-200 text-sm">{error}</div>}
            {success && <div className="mb-3 bg-green-500/20 border border-green-400/30 rounded-lg p-3 text-green-200 text-sm">{success}</div>}

            <button type="submit" disabled={saving}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </form>

          {/* Account Info */}
          {profile && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-4">Account Info</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/50">Name</dt>
                  <dd className="text-white font-medium">{profile.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Email</dt>
                  <dd className="text-white">{profile.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Recruiter Code</dt>
                  <dd className="font-mono text-blue-300 font-bold">{profile.recruiterCode}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Member Since</dt>
                  <dd className="text-white/70">{new Date(profile.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="text-center">
            <button onClick={() => { logout(); navigate('/recruiter/login'); }}
              className="text-red-400 hover:text-red-300 text-sm transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
