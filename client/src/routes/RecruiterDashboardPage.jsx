import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import { fetchRecruiterDashboard } from '../lib/api';
import { formatUsdCents } from '../lib/format';
import { API_BASE } from '../utils/config';
import '../styles/dashboard.css';

const SECTION_IDS = ['overview', 'activity', 'referrals', 'commissions', 'payouts', 'profile', 'settings', 'support', 'analytics'];
const QR_CODE_SIZE = 128;
const QR_CODE_MARGIN = 1;

function toMoney(value) {
  return formatUsdCents(value || 0);
}

function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', options);
}

function SkeletonCard() {
  return (
    <div className="dashboard-card skeleton-card">
      <div className="skeleton-line w-50" />
      <div className="skeleton-line w-80" />
      <div className="skeleton-line w-30" />
    </div>
  );
}

function EmptyBlock({ title, message }) {
  return (
    <div className="dashboard-empty">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

function SparkBar({ value, max }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <div className="spark-row">
      <div className="spark-track"><div className="spark-fill" style={{ width: `${pct}%` }} /></div>
      <span>{value}</span>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const { recruiter, logout, authFetch } = useRecruiterAuth();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrGenerating, setQrGenerating] = useState(false);
  const [filters, setFilters] = useState({ status: '', month: '', year: '', trade: '', state: '' });
  const [saveState, setSaveState] = useState({ loading: false, message: '', error: '' });
  const [passwordState, setPasswordState] = useState({ currentPassword: '', newPassword: '' });

  const [profileDraft, setProfileDraft] = useState({
    phone: '',
    photo: '',
    city: '',
    state: '',
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      commissionAlerts: true,
      weeklySummaryEmails: true,
      referralAlerts: true
    },
    language: 'en-US',
    timeZone: 'UTC'
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchRecruiterDashboard({ userId: searchParams.get('userId') || '' });
      setProfileDraft({
        phone: data?.profile?.phone || '',
        photo: data?.profile?.photo || '',
        city: data?.profile?.city || '',
        state: data?.profile?.state || '',
        notifications: {
          emailNotifications: data?.settings?.emailNotifications ?? true,
          smsNotifications: data?.settings?.smsNotifications ?? true,
          commissionAlerts: data?.settings?.commissionAlerts ?? true,
          weeklySummaryEmails: data?.settings?.weeklySummaryEmails ?? true,
          referralAlerts: data?.settings?.referralAlerts ?? true
        },
        language: data?.settings?.language || 'en-US',
        timeZone: data?.settings?.timeZone || 'UTC'
      });
      setState({ loading: false, error: '', data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, [searchParams]);

  React.useEffect(() => { load(); }, [load]);

  const data = state.data;
  const referrals = data?.referrals || [];
  const activities = data?.recentActivity || [];
  const commissions = data?.commissions?.rows || [];
  const payouts = data?.payouts?.rows || [];
  const analytics = data?.analytics || {};
  const charts = {
    monthlySignups: analytics.monthlySignups || [],
    monthlyEarnings: analytics.monthlyEarnings || [],
    referralConversion: analytics.referralConversion || [],
    retention: analytics.retention || [],
    subscriptionRenewals: analytics.subscriptionRenewals || [],
    commissionGrowth: analytics.commissionGrowth || []
  };

  const filteredReferrals = useMemo(() => {
    return referrals.filter((row) => {
      const haystack = `${row.professionalName} ${row.trade} ${row.city} ${row.status}`.toLowerCase();
      const searchOk = !search.trim() || haystack.includes(search.trim().toLowerCase());
      const statusOk = !filters.status || row.status === filters.status;
      const tradeOk = !filters.trade || row.trade === filters.trade;
      const stateOk = !filters.state || row.state === filters.state;
      const yearOk = !filters.year || String(new Date(row.signupDate).getFullYear()) === String(filters.year);
      const monthOk = !filters.month || new Date(row.signupDate).toLocaleDateString('en-US', { month: 'short' }) === filters.month;
      return searchOk && statusOk && tradeOk && stateOk && yearOk && monthOk;
    });
  }, [filters, referrals, search]);

  const saveProfileSettings = useCallback(async () => {
    setSaveState({ loading: true, error: '', message: '' });
    try {
      const payload = {
        phoneNumber: profileDraft.phone,
        profilePhotoUrl: profileDraft.photo,
        city: profileDraft.city,
        state: profileDraft.state,
        notificationSettings: profileDraft.notifications,
        language: profileDraft.language,
        timeZone: profileDraft.timeZone
      };
      if (passwordState.currentPassword || passwordState.newPassword) {
        payload.currentPassword = passwordState.currentPassword;
        payload.newPassword = passwordState.newPassword;
      }
      const res = await authFetch(`${API_BASE}/api/recruiter/settings`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Unable to save settings');
      setPasswordState({ currentPassword: '', newPassword: '' });
      setSaveState({ loading: false, error: '', message: 'Profile and settings updated.' });
      await load();
    } catch (error) {
      setSaveState({ loading: false, error: error.message, message: '' });
    }
  }, [authFetch, load, passwordState.currentPassword, passwordState.newPassword, profileDraft]);

  const copyReferralLink = useCallback(async () => {
    if (!data?.referralLink?.url) return;
    await navigator.clipboard.writeText(data.referralLink.url);
    setSaveState((prev) => ({ ...prev, message: 'Referral link copied.' }));
  }, [data]);

  const shareReferralLink = useCallback(async () => {
    const url = data?.referralLink?.url;
    if (!url) return;
    if (navigator.share) {
      await navigator.share({ title: 'Join Fixlo', url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setSaveState((prev) => ({ ...prev, message: 'Referral link copied for sharing.' }));
  }, [data]);

  const generateQrCode = useCallback(async () => {
    const url = data?.referralLink?.url;
    if (!url) return;
    setQrGenerating(true);
    try {
      const code = await QRCode.toDataURL(url, { width: QR_CODE_SIZE, margin: QR_CODE_MARGIN });
      setQrCodeDataUrl(code);
    } finally {
      setQrGenerating(false);
    }
  }, [data]);

  const goToSection = useCallback((sectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (state.loading) {
    return (
      <div className="dashboard-shell premium">
        <div className="dashboard-main premium-main">
          <div className="dashboard-grid metrics-grid">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          <div className="dashboard-grid metrics-grid">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="dashboard-shell premium">
        <div className="dashboard-main premium-main">
          <div className="dashboard-error">
            <h3>Couldn’t load recruiter dashboard</h3>
            <p>{state.error}</p>
            <button type="button" className="dashboard-btn" onClick={load}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const commissionSummary = data?.commissions?.summary || {};
  const maxChart = {
    monthlySignups: Math.max(1, ...charts.monthlySignups.map((x) => x.value || 0)),
    monthlyEarnings: Math.max(1, ...charts.monthlyEarnings.map((x) => x.value || 0)),
    referralConversion: Math.max(1, ...charts.referralConversion.map((x) => x.value || 0)),
    retention: Math.max(1, ...charts.retention.map((x) => x.value || 0)),
    subscriptionRenewals: Math.max(1, ...charts.subscriptionRenewals.map((x) => x.value || 0)),
    commissionGrowth: Math.max(1, ...charts.commissionGrowth.map((x) => Math.abs(x.value || 0)))
  };

  return (
    <div className="dashboard-shell premium">
      <aside className="dashboard-sidebar premium-sidebar">
        <div className="sidebar-brand">Fixlo Recruiter</div>
        <nav>
          <ul>
            {SECTION_IDS.map((id) => (
              <li key={id}>
                <button type="button" className={`sidebar-link ${activeSection === id ? 'active' : ''}`} onClick={() => goToSection(id)}>
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              </li>
            ))}
            <li><button type="button" className="sidebar-link" onClick={logout}>Log Out</button></li>
          </ul>
        </nav>
      </aside>

      <main className="dashboard-main premium-main">
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, {data?.welcome?.firstName || recruiter?.name || 'Recruiter'}</h1>
            <p className="dashboard-user">{formatDate(data?.welcome?.today, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="dashboard-header-right">
            {data?.meta?.isImpersonating ? <span className="dashboard-status dashboard-status-pending">Impersonating recruiter</span> : null}
            <span className="dashboard-range">Production Data</span>
          </div>
        </header>

        {saveState.message ? <div className="dashboard-success">{saveState.message}</div> : null}
        {saveState.error ? <div className="dashboard-error compact"><p>{saveState.error}</p></div> : null}

        <section id="overview" className="dashboard-section">
          <h2>Overview</h2>
          <div className="dashboard-grid metrics-grid">
            <article className="dashboard-card"><p className="metric-label">Pros Recruited</p><p className="metric-value">{overview.prosRecruited || 0}</p></article>
            <article className="dashboard-card"><p className="metric-label">Pending Pros</p><p className="metric-value">{overview.pendingPros || 0}</p></article>
            <article className="dashboard-card"><p className="metric-label">Active Pros</p><p className="metric-value">{overview.activePros || 0}</p></article>
            <article className="dashboard-card"><p className="metric-label">Monthly Earnings</p><p className="metric-value">{toMoney(overview.monthlyEarnings)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Lifetime Earnings</p><p className="metric-value">{toMoney(overview.lifetimeEarnings)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Pending Commissions</p><p className="metric-value">{toMoney(overview.pendingCommissions)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Paid Commissions</p><p className="metric-value">{toMoney(overview.paidCommissions)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Average Pro Retention</p><p className="metric-value">{overview.averageProRetention || 0}%</p></article>
            <article className="dashboard-card"><p className="metric-label">Referral Conversion Rate</p><p className="metric-value">{overview.referralConversionRate || 0}%</p></article>
          </div>
        </section>

        <section id="activity" className="dashboard-section">
          <h2>Recent Activity</h2>
          {activities.length === 0 ? (
            <EmptyBlock title="No recent activity." message="Activity will appear as referrals and commissions update." />
          ) : (
            <div className="dashboard-card timeline">
              {activities.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className="timeline-dot" />
                  <div>
                    <p className="timeline-title">{item.type}</p>
                    <p className="timeline-meta">{item.professional ? `${item.professional} • ` : ''}{formatDate(item.date, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    {item.amount ? <p className="timeline-amount">{toMoney(item.amount)}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="referrals" className="dashboard-section">
          <h2>Referrals</h2>
          <div className="dashboard-card controls">
            <input className="dashboard-input" placeholder="Search by name, trade, city, status" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="dashboard-input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              {(data?.filters?.statuses || []).map((status) => <option value={status} key={status}>{status}</option>)}
            </select>
            <select className="dashboard-input" value={filters.trade} onChange={(e) => setFilters((f) => ({ ...f, trade: e.target.value }))}>
              <option value="">All trades</option>
              {(data?.filters?.trades || []).map((trade) => <option value={trade} key={trade}>{trade}</option>)}
            </select>
            <select className="dashboard-input" value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}>
              <option value="">All states</option>
              {(data?.filters?.states || []).map((stateOpt) => <option value={stateOpt} key={stateOpt}>{stateOpt}</option>)}
            </select>
            <select className="dashboard-input" value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}>
              <option value="">Any month</option>
              {(data?.filters?.months || []).map((month) => <option value={month} key={month}>{month}</option>)}
            </select>
            <select className="dashboard-input" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
              <option value="">Any year</option>
              {(data?.filters?.years || []).map((year) => <option value={year} key={year}>{year}</option>)}
            </select>
          </div>
          {filteredReferrals.length === 0 ? (
            <EmptyBlock title="You haven't recruited anyone yet." message="Invite your first professional to start building your referral network." />
          ) : (
            <div className="dashboard-grid referral-grid">
              {filteredReferrals.map((row) => (
                <article className="dashboard-card referral-card" key={row.id}>
                  <div className="referral-card-header">
                    <h3>{row.professionalName}</h3>
                    <span className={`dashboard-status dashboard-status-${row.status}`}>{row.status}</span>
                  </div>
                  <p className="metric-helper">{row.trade || 'Trade not set'} • {row.city || '—'}, {row.state || '—'}</p>
                  <p className="metric-helper">Signup Date: {formatDate(row.signupDate)}</p>
                  <p className="metric-helper">Subscription: {row.subscriptionStatus || 'inactive'}</p>
                  <p className="metric-helper">Referral Code: {row.referralCode || '—'}</p>
                  <p className="metric-helper">30-Day Qualification Progress: {row.qualificationProgress}%</p>
                  <p className="metric-helper">Current Commission Level: L{row.commissionLevel || 1}</p>
                  <div className="referral-actions">
                    <button type="button" className="dashboard-btn ghost">View Details</button>
                    <button type="button" className="dashboard-btn ghost" onClick={() => navigator.clipboard.writeText(row.referralLink || '')}>Copy Referral Link</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="commissions" className="dashboard-section">
          <h2>Commissions</h2>
          <div className="dashboard-grid metrics-grid">
            <article className="dashboard-card"><p className="metric-label">Pending</p><p className="metric-value">{toMoney(commissionSummary.pending)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Approved</p><p className="metric-value">{toMoney(commissionSummary.approved)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Paid</p><p className="metric-value">{toMoney(commissionSummary.paid)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Rejected</p><p className="metric-value">{toMoney(commissionSummary.rejected)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Total Earned</p><p className="metric-value">{toMoney(commissionSummary.totalEarned)}</p></article>
            <article className="dashboard-card"><p className="metric-label">This Month</p><p className="metric-value">{toMoney(commissionSummary.thisMonth)}</p></article>
            <article className="dashboard-card"><p className="metric-label">This Year</p><p className="metric-value">{toMoney(commissionSummary.thisYear)}</p></article>
            <article className="dashboard-card"><p className="metric-label">Lifetime</p><p className="metric-value">{toMoney(commissionSummary.lifetime)}</p></article>
          </div>
          {commissions.length === 0 ? (
            <EmptyBlock title="No commissions yet." message="Commissions will appear once your referrals complete qualifying subscriptions." />
          ) : (
            <div className="dashboard-card table-scroll">
              <table className="dashboard-table">
                <thead><tr><th>Professional</th><th>Subscription</th><th>Amount</th><th>Date Earned</th><th>Payment Status</th><th>Expected Payout Date</th></tr></thead>
                <tbody>
                  {commissions.map((row) => (
                    <tr key={row.id}>
                      <td>{row.professional}</td>
                      <td>{toMoney(row.subscription)}</td>
                      <td>{toMoney(row.amount)}</td>
                      <td>{formatDate(row.dateEarned)}</td>
                      <td><span className={`dashboard-status dashboard-status-${row.paymentStatus}`}>{row.paymentStatus}</span></td>
                      <td>{formatDate(row.expectedPayoutDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="payouts" className="dashboard-section">
          <h2>Payouts</h2>
          {payouts.length === 0 ? (
            <EmptyBlock title="You haven't received a payout yet." message="Payout history will appear after your first successful payout." />
          ) : (
            <div className="dashboard-card table-scroll">
              <table className="dashboard-table">
                <thead><tr><th>Payment Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Transaction ID</th></tr></thead>
                <tbody>
                  {payouts.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.paymentDate)}</td>
                      <td>{toMoney(row.amount)}</td>
                      <td>{row.method}</td>
                      <td><span className={`dashboard-status dashboard-status-${row.status}`}>{row.status}</span></td>
                      <td className="mono">{row.transactionId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="profile" className="dashboard-section">
          <h2>Profile</h2>
          <div className="dashboard-grid profile-grid">
            <div className="dashboard-card">
              <div className="profile-header">
                {profileDraft.photo ? <img src={profileDraft.photo} alt={data?.profile?.name || 'Recruiter'} className="profile-photo" /> : <div className="profile-photo placeholder">{(data?.profile?.name || 'R').charAt(0)}</div>}
                <div>
                  <p className="metric-value profile-name">{data?.profile?.name || 'Recruiter'}</p>
                  <p className="metric-helper">{data?.profile?.email || '—'}</p>
                </div>
              </div>
              <p className="metric-helper">Recruiter Since: {formatDate(data?.profile?.recruiterSince)}</p>
              <p className="metric-helper">Referral Code: {data?.profile?.referralCode || '—'}</p>
              <p className="metric-helper">Stripe Connect Status: {data?.profile?.stripeConnectStatus || 'not_connected'}</p>
              <p className="metric-helper">Twilio Verified Status: {data?.profile?.twilioVerifiedStatus || 'not_verified'}</p>
            </div>
            <div className="dashboard-card">
              <label className="dashboard-label">Phone</label>
              <input className="dashboard-input" value={profileDraft.phone} onChange={(e) => setProfileDraft((v) => ({ ...v, phone: e.target.value }))} />
              <label className="dashboard-label">Profile Photo URL</label>
              <input className="dashboard-input" value={profileDraft.photo} onChange={(e) => setProfileDraft((v) => ({ ...v, photo: e.target.value }))} />
              <label className="dashboard-label">City</label>
              <input className="dashboard-input" value={profileDraft.city} onChange={(e) => setProfileDraft((v) => ({ ...v, city: e.target.value }))} />
              <label className="dashboard-label">State</label>
              <input className="dashboard-input" value={profileDraft.state} onChange={(e) => setProfileDraft((v) => ({ ...v, state: e.target.value }))} />
            </div>
          </div>
        </section>

        <section id="settings" className="dashboard-section">
          <h2>Settings</h2>
          <div className="dashboard-grid settings-grid">
            <div className="dashboard-card">
              {Object.entries(profileDraft.notifications).map(([key, value]) => (
                <label className="toggle-row" key={key}>
                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</span>
                  <input type="checkbox" checked={!!value} onChange={(e) => setProfileDraft((v) => ({ ...v, notifications: { ...v.notifications, [key]: e.target.checked } }))} />
                </label>
              ))}
            </div>
            <div className="dashboard-card">
              <label className="dashboard-label">Language</label>
              <input className="dashboard-input" value={profileDraft.language} onChange={(e) => setProfileDraft((v) => ({ ...v, language: e.target.value }))} />
              <label className="dashboard-label">Time Zone</label>
              <input className="dashboard-input" value={profileDraft.timeZone} onChange={(e) => setProfileDraft((v) => ({ ...v, timeZone: e.target.value }))} />
              <label className="dashboard-label">Current Password</label>
              <input type="password" className="dashboard-input" value={passwordState.currentPassword} onChange={(e) => setPasswordState((s) => ({ ...s, currentPassword: e.target.value }))} />
              <label className="dashboard-label">New Password</label>
              <input type="password" className="dashboard-input" value={passwordState.newPassword} onChange={(e) => setPasswordState((s) => ({ ...s, newPassword: e.target.value }))} />
              <button type="button" className="dashboard-btn" onClick={saveProfileSettings} disabled={saveState.loading}>{saveState.loading ? 'Saving…' : 'Save Settings'}</button>
            </div>
          </div>
        </section>

        <section id="support" className="dashboard-section">
          <h2>Support</h2>
          <div className="dashboard-grid metrics-grid">
            <article className="dashboard-card"><h3>FAQ</h3><p className="metric-helper">{data?.support?.faq?.length || 0} articles available</p></article>
            <article className="dashboard-card"><h3>Contact Support</h3><p className="metric-helper">{data?.support?.contacts?.supportEmail || 'support@fixloapp.com'}</p></article>
            <article className="dashboard-card"><h3>Report an Issue</h3><p className="metric-helper">Create a support request from your account.</p></article>
            <article className="dashboard-card"><h3>Feature Request</h3><p className="metric-helper">Send product feedback to support.</p></article>
            <article className="dashboard-card"><h3>Documentation</h3><a className="metric-helper" href={data?.support?.contacts?.documentationUrl} target="_blank" rel="noreferrer">Open docs</a></article>
            <article className="dashboard-card"><h3>Live Status</h3><a className="metric-helper" href={data?.support?.contacts?.statusUrl} target="_blank" rel="noreferrer">View status</a></article>
          </div>
          {(data?.support?.ticketHistory || []).length === 0 ? (
            <EmptyBlock title="No support ticket history." message="Your support ticket history will appear here." />
          ) : (
            <div className="dashboard-card table-scroll">
              <table className="dashboard-table">
                <thead><tr><th>Subject</th><th>Category</th><th>Status</th><th>Created</th><th>Updated</th></tr></thead>
                <tbody>
                  {data.support.ticketHistory.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.subject}</td>
                      <td>{ticket.category}</td>
                      <td><span className={`dashboard-status dashboard-status-${ticket.status}`}>{ticket.status}</span></td>
                      <td>{formatDate(ticket.createdAt)}</td>
                      <td>{formatDate(ticket.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="analytics" className="dashboard-section">
          <h2>Analytics</h2>
          <div className="dashboard-grid chart-grid">
            {[
              ['Monthly Signups', charts.monthlySignups, maxChart.monthlySignups],
              ['Monthly Earnings', charts.monthlyEarnings, maxChart.monthlyEarnings],
              ['Referral Conversion', charts.referralConversion, maxChart.referralConversion],
              ['Retention', charts.retention, maxChart.retention],
              ['Subscription Renewals', charts.subscriptionRenewals, maxChart.subscriptionRenewals],
              ['Commission Growth', charts.commissionGrowth, maxChart.commissionGrowth]
            ].map(([title, rows, max]) => (
              <article className="dashboard-card" key={title}>
                <h3>{title}</h3>
                {(rows || []).length === 0 ? (
                  <p className="metric-helper">No data yet.</p>
                ) : (
                  <div className="spark-list">
                    {(rows || []).map((row) => (
                      <div className="spark-item" key={`${title}-${row.month}`}>
                        <span className="spark-label">{row.month}</span>
                        <SparkBar value={Math.abs(row.value || 0)} max={max} />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="dashboard-grid metrics-grid">
            <article className="dashboard-card">
              <p className="metric-label">Recruiter Score</p>
              <p className="metric-value">{data?.performanceScore?.score || 0} / {data?.performanceScore?.max || 100}</p>
              <p className="metric-helper">{data?.performanceScore?.label || '—'}</p>
            </article>
            <article className="dashboard-card">
              <p className="metric-label">Referral Link</p>
              <p className="copy-link-value">{data?.referralLink?.url || '—'}</p>
              <div className="referral-actions">
                <button type="button" className="dashboard-btn ghost" onClick={copyReferralLink}>Copy Link</button>
                <button type="button" className="dashboard-btn ghost" onClick={shareReferralLink}>Share</button>
                <button type="button" className="dashboard-btn ghost" onClick={generateQrCode} disabled={qrGenerating}>
                  {qrGenerating ? 'Generating…' : 'Generate QR Code'}
                </button>
              </div>
              {qrCodeDataUrl ? (
                <img
                  alt="Referral QR code"
                  className="qr-preview"
                  src={qrCodeDataUrl}
                />
              ) : null}
            </article>
          </div>
        </section>

        <nav className="dashboard-mobile-nav">
          {SECTION_IDS.map((section) => (
            <button key={section} type="button" onClick={() => goToSection(section)} className={activeSection === section ? 'active' : ''}>
              {section.charAt(0).toUpperCase()}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
