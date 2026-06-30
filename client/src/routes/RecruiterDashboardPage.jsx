import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import { fetchOwnerDashboard } from '../lib/api';
import HelmetSEO from '../seo/HelmetSEO';

// ── Formatting helpers ─────────────────────────────────────────────────────────

function fmtMoney(cents) {
  return '$' + ((cents || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtNum(n) {
  return (n ?? 0).toLocaleString('en-US');
}

function fmtPct(n) {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n}%`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ── Reusable UI components ─────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'blue', icon, trend }) {
  const gradients = {
    blue: 'from-blue-600 to-blue-800',
    green: 'from-emerald-600 to-emerald-800',
    yellow: 'from-amber-500 to-amber-700',
    purple: 'from-purple-600 to-purple-800',
    teal: 'from-teal-600 to-teal-800',
    red: 'from-red-600 to-red-800',
    indigo: 'from-indigo-600 to-indigo-800',
    rose: 'from-rose-600 to-rose-800'
  };
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br text-white shadow-lg ${gradients[color] || gradients.blue}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider truncate">{label}</p>
          <p className="text-2xl font-extrabold mt-1">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
          {trend != null && (
            <p className={`text-xs mt-1 font-semibold ${trend >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {fmtPct(trend)} MoM
            </p>
          )}
        </div>
        {icon && <span className="text-3xl opacity-40 shrink-0 ml-2">{icon}</span>}
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-lg font-bold text-white mb-3 mt-6 flex items-center gap-2">
      {children}
    </h2>
  );
}

function Panel({ title, children, className = '' }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-blue-200 mb-3">{title}</h3>}
      {children}
    </div>
  );
}

function EmptyState({ message = 'No data yet' }) {
  return (
    <p className="text-white/40 text-sm italic py-4 text-center">{message}</p>
  );
}

function StatusPill({ status }) {
  const map = {
    sent: 'bg-emerald-500/20 text-emerald-300',
    failed: 'bg-red-500/20 text-red-300',
    skipped: 'bg-white/10 text-white/50',
    pending: 'bg-amber-500/20 text-amber-300',
    active: 'bg-emerald-500/20 text-emerald-300',
    inactive: 'bg-red-500/20 text-red-300',
    clear: 'bg-emerald-500/20 text-emerald-300',
    consider: 'bg-amber-500/20 text-amber-300',
    dispute: 'bg-red-500/20 text-red-300'
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || 'bg-white/10 text-white/60'}`}>
      {status}
    </span>
  );
}

// ── Mini bar chart ─────────────────────────────────────────────────────────────

function MiniBarChart({ data, valueKey, label }) {
  if (!data?.length) return <EmptyState message="No chart data yet" />;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-1 h-24 mt-2">
      {data.map((d, i) => {
        const pct = ((d[valueKey] || 0) / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-white/40">{d[valueKey] || 0}</span>
            <div className="w-full bg-white/10 rounded-t overflow-hidden" style={{ height: '60px' }}>
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all"
                style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
              />
            </div>
            <span className="text-[9px] text-white/30">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Breakdown list ─────────────────────────────────────────────────────────────

function BreakdownList({ items, total }) {
  if (!items?.length) return <EmptyState />;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2 mt-1">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs text-white/60 mb-0.5">
            <span className="capitalize">{item.label}</span>
            <span className="font-semibold text-white/80">{item.count}</span>
          </div>
          <div className="bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── US State Map (table view) ──────────────────────────────────────────────────

function USStateTable({ data }) {
  if (!data?.length) return <EmptyState message="No state data yet. Leads with state info will appear here." />;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-1.5 mt-1 max-h-60 overflow-y-auto pr-1">
      {data.slice(0, 20).map((row) => (
        <div key={row.state} className="flex items-center gap-2">
          <span className="text-xs font-mono text-white/70 w-8 shrink-0">{row.state}</span>
          <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-white/60 w-6 text-right shrink-0">{row.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function RecruiterDashboardPage() {
  const navigate = useNavigate();
  const { recruiter, isAuthenticated, loading: authLoading, logout } = useRecruiterAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/recruiter/login', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchOwnerDashboard();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto" />
          <p className="text-white/50 mt-4 text-sm">Loading executive dashboard…</p>
        </div>
      </div>
    );
  }

  if (error === 'Owner access required') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Restricted Access</h1>
          <p className="text-white/50 text-sm mb-6">
            This executive dashboard is only accessible to the Fixlo owner.
          </p>
          <button
            onClick={() => { logout(); navigate('/recruiter/login'); }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-xl text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">Could not load dashboard</h1>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    referrals = {},
    commissions = {},
    pros = {},
    leads = {},
    revenue = {},
    sms = {},
    ownerAlerts = {},
    stripe = {},
    growth = {}
  } = data;

  // Build breakdown items for charts
  const subBreakdown = Object.entries(pros.subscriptionBreakdown || {}).map(([label, count]) => ({ label, count }));
  const checkrBreakdown = Object.entries(pros.checkrStatus || {}).map(([label, count]) => ({ label, count }));
  const leadStatusBreakdown = Object.entries(leads.statusBreakdown || {}).map(([label, count]) => ({ label, count }));
  const commissionStatuses = Object.entries(commissions.byStatus || {}).map(([label, info]) => ({
    label,
    count: info.count || 0,
    total: info.total || 0
  }));

  return (
    <>
      <HelmetSEO
        title="Owner Executive Dashboard | Fixlo"
        canonicalPathname="/recruiter/dashboard"
        description="Private Fixlo owner executive dashboard"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-white">

        {/* Top nav */}
        <div className="border-b border-white/10 bg-white/5 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/fixlo-logo.png" alt="Fixlo" className="h-7" />
              <span className="text-white/30">|</span>
              <span className="text-sm font-semibold text-blue-300">Owner Executive Dashboard</span>
              <span className="hidden sm:inline text-xs bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 rounded-full">
                🔒 Private
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/50 hidden sm:block">{recruiter?.email}</span>
              <button
                onClick={() => { logout(); navigate('/recruiter/login'); }}
                className="text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold">Welcome back, {recruiter?.name || 'Owner'}!</h1>
            <p className="text-white/40 mt-1 text-sm">
              Last refreshed: {fmtDate(data.generatedAt)}
              &nbsp;·&nbsp;
              <button onClick={fetchData} className="text-blue-400 hover:text-blue-300 underline">Refresh</button>
            </p>
          </div>

          {/* ── Real-time Alerts Banner ──────────────────────────────────────── */}
          {ownerAlerts.recentAlerts?.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="text-sm font-semibold text-blue-200">Latest Alert</p>
                <p className="text-xs text-white/60 mt-0.5">
                  {ownerAlerts.recentAlerts[0].type.replace(/_/g, ' ')} — {fmtDate(ownerAlerts.recentAlerts[0].sentAt)}
                </p>
              </div>
            </div>
          )}

          {/* ── Active Users & Platform Health ──────────────────────────────── */}
          <SectionHeading>📊 Platform Overview</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Total Pros" value={fmtNum(pros.total)} icon="👷" color="blue" />
            <StatCard label="Active Subscribers" value={fmtNum(pros.active)} icon="✅" color="green" />
            <StatCard label="Pros This Week" value={fmtNum(pros.thisWeek)} icon="📈" color="teal" trend={pros.growthMoM} />
            <StatCard label="Total Leads" value={fmtNum(leads.total)} icon="📋" color="purple" />
            <StatCard label="Leads Today" value={fmtNum(leads.today)} icon="📬" color="indigo" />
          </div>

          {/* ── Revenue Projections ──────────────────────────────────────────── */}
          <SectionHeading>💰 Revenue Projections</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Projected Monthly Revenue"
              value={fmtMoney(revenue.projectedMonthly)}
              sub={`${fmtNum(revenue.activeSubs)} active × ${fmtMoney(revenue.monthlyPriceCents)}/mo`}
              icon="💵"
              color="green"
            />
            <StatCard
              label="Total Commission Paid"
              value={fmtMoney(commissions.totalPaid)}
              sub={`${fmtNum(commissions.totalPayouts)} payouts`}
              icon="🏦"
              color="teal"
            />
            <StatCard
              label="Pending Commissions"
              value={fmtMoney(commissions.byStatus?.pending?.total)}
              sub="Awaiting approval"
              icon="⏳"
              color="yellow"
            />
            <StatCard
              label="Held Commissions"
              value={fmtMoney(commissions.byStatus?.held?.total)}
              sub="In verification"
              icon="🔒"
              color="red"
            />
          </div>

          {/* ── Growth Metrics (daily chart) ────────────────────────────────── */}
          <SectionHeading>📈 Growth Metrics (Last 7 Days)</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Panel title="Daily Leads">
              <MiniBarChart data={growth.daily} valueKey="leads" label="leads" />
            </Panel>
            <Panel title="Daily New Pros">
              <MiniBarChart data={growth.daily} valueKey="pros" label="pros" />
            </Panel>
            <Panel title="Daily Referrals">
              <MiniBarChart data={growth.daily} valueKey="referrals" label="referrals" />
            </Panel>
          </div>

          {/* ── Referral Analytics ──────────────────────────────────────────── */}
          <SectionHeading>🤝 Referral Analytics</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <StatCard label="Weekly Referrals" value={fmtNum(referrals.weekly)} icon="📅" color="blue" />
            <StatCard label="Monthly Referrals" value={fmtNum(referrals.monthly)} icon="📆" color="indigo" />
            <StatCard label="Converted Pros" value={fmtNum(referrals.converted)} icon="✅" color="green" />
            <StatCard label="Conversion Rate" value={`${referrals.conversionRate ?? 0}%`} icon="🎯" color="teal" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Panel title="Referral Sources">
              {referrals.sources?.length > 0 ? (
                <BreakdownList items={referrals.sources.map((s) => ({ label: s.source, count: s.count }))} />
              ) : (
                <EmptyState message="No referral source data yet" />
              )}
            </Panel>
            <Panel title="Commission by Status (All Time)">
              {commissionStatuses.length > 0 ? (
                <div className="space-y-2 mt-1">
                  {commissionStatuses.map((s) => (
                    <div key={s.label} className="flex justify-between text-xs">
                      <span className="capitalize text-white/60">{s.label}</span>
                      <span className="text-white/80 font-semibold">
                        {fmtMoney(s.total)} <span className="text-white/40">({s.count})</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No commission data yet" />
              )}
            </Panel>
          </div>

          {/* ── Pro Onboarding & Subscription ───────────────────────────────── */}
          <SectionHeading>👷 Pro Onboarding & Subscriptions</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Panel title="Subscription Types">
              <BreakdownList items={subBreakdown.sort((a, b) => b.count - a.count)} />
            </Panel>
            <Panel title="Checkr Background Check Status">
              <BreakdownList items={checkrBreakdown.sort((a, b) => b.count - a.count)} />
            </Panel>
            <Panel title="Pro Growth">
              <div className="space-y-2 mt-1 text-xs">
                {[
                  { label: 'This Week', value: fmtNum(pros.thisWeek) },
                  { label: 'This Month', value: fmtNum(pros.thisMonth) },
                  { label: 'Last Month', value: fmtNum(pros.lastMonth) },
                  { label: 'MoM Growth', value: fmtPct(pros.growthMoM) }
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-white/50">{row.label}</span>
                    <span className="text-white/80 font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* ── Service Requests & US Map ────────────────────────────────────── */}
          <SectionHeading>📍 Service Request Statistics &amp; US Distribution</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Panel title="Request Status Breakdown">
              <BreakdownList items={leadStatusBreakdown.sort((a, b) => b.count - a.count)} />
            </Panel>
            <Panel title="Lead Growth">
              <div className="space-y-2 mt-1 text-xs">
                {[
                  { label: 'Today', value: fmtNum(leads.today) },
                  { label: 'This Week', value: fmtNum(leads.thisWeek) },
                  { label: 'This Month', value: fmtNum(leads.thisMonth) },
                  { label: 'Last Month', value: fmtNum(leads.lastMonth) },
                  { label: 'MoM Growth', value: fmtPct(leads.growthMoM) }
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-white/50">{row.label}</span>
                    <span className="text-white/80 font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Referral Distribution by State (US Map)">
              <USStateTable data={leads.stateDistribution} />
            </Panel>
          </div>

          {/* ── Stripe Subscription Overview ────────────────────────────────── */}
          <SectionHeading>💳 Stripe Subscription Overview</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Stripe Status"
              value={stripe.configured ? 'Connected' : 'Not configured'}
              icon="💳"
              color={stripe.configured ? 'green' : 'red'}
            />
            <StatCard
              label="Active Subscriptions"
              value={fmtNum(pros.active)}
              sub="Paying subscribers"
              icon="📋"
              color="blue"
            />
            <StatCard
              label="Lifetime Members"
              value={fmtNum(pros.subscriptionBreakdown?.lifetime)}
              icon="🌟"
              color="purple"
            />
            <StatCard
              label="Monthly Revenue (Proj.)"
              value={fmtMoney(revenue.projectedMonthly)}
              icon="💰"
              color="green"
            />
          </div>

          {/* ── Twilio SMS Dashboard ─────────────────────────────────────────── */}
          <SectionHeading>📱 Twilio SMS Dashboard</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="Twilio Status"
              value={sms.twilioConfigured ? 'Configured' : 'Not configured'}
              icon="📡"
              color={sms.twilioConfigured ? 'green' : 'red'}
            />
            <StatCard label="SMS Sent (All Time)" value={fmtNum(sms.sentTotal)} icon="✉️" color="blue" />
            <StatCard label="SMS This Month" value={fmtNum(sms.sentThisMonth)} icon="📅" color="teal" />
            <StatCard label="SMS Failed (All Time)" value={fmtNum(sms.failedTotal)} icon="❌" color="red" />
          </div>

          {/* ── Owner SMS Alerts Card ────────────────────────────────────────── */}
          <SectionHeading>🚨 Owner SMS Alerts</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Panel title="Alert Configuration">
              <div className="space-y-2 mt-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">Status</span>
                  <StatusPill status={ownerAlerts.enabled ? 'active' : 'inactive'} />
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Last Alert Sent</span>
                  <span className="text-white/80">{fmtDate(ownerAlerts.lastSentAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Triggers</span>
                  <span className="text-white/60">Recruiter / Pro / Lead</span>
                </div>
              </div>
            </Panel>
            <Panel title="Recent Alert History" className="sm:col-span-2">
              {ownerAlerts.recentAlerts?.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {ownerAlerts.recentAlerts.map((alert, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-xs border-b border-white/5 pb-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-white/70 capitalize font-semibold">
                          {alert.type.replace(/_/g, ' ')}
                        </span>
                        <p className="text-white/40 truncate mt-0.5">{alert.message}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <StatusPill status={alert.status} />
                        <span className="text-white/30">{fmtDate(alert.sentAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No owner alerts yet. Alerts will appear here after the first recruiter signup, pro signup, or homeowner lead." />
              )}
            </Panel>
          </div>

        </div>
      </div>
    </>
  );
}


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
  const [generating, setGenerating] = useState('');
  const [latestCodes, setLatestCodes] = useState({ pro: null, recruiter: null });

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

  const generateOneTimeCode = async (type) => {
    setGenerating(type);
    try {
      const res = await authFetch(`${API_BASE}/api/recruiter/codes/generate`, {
        method: 'POST',
        body: JSON.stringify({ type, expiresInDays: 30 })
      });
      const json = await res.json();
      if (json.ok && json.code?.code) {
        const createdCode = json.code.code;
        const baseUrl = window.location.origin;
        const link = type === 'recruiter'
          ? `${baseUrl}/recruiter/signup?ref=${createdCode}`
          : `${baseUrl}/pros/signup?ref=${createdCode}`;
        setLatestCodes((prev) => ({ ...prev, [type]: link }));
      }
    } catch (err) {
      console.error('One-time code generation failed:', err);
    } finally {
      setGenerating('');
    }
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
            <p className="text-white/50 mt-1">
              Stripe Connect: <span className={rec.stripeConnectOnboarded ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
                {rec.stripeConnectOnboarded ? 'Connected' : 'Not Connected'}
              </span>
            </p>
          </div>

          {/* Referral Links */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="font-semibold mb-4 text-blue-200">My Referral Links</h2>
            <div className="space-y-3">
              {[
                { label: 'Recruiter Code', value: rec.recruiterCode, key: 'code' },
                { label: 'Pro Referral Link', url: rec.proReferralLink || rec.recruiterLink, key: 'pro-referral-link' },
                { label: 'Recruiter Referral Link', url: rec.recruiterReferralLink || rec.recruiterRecruiterLink, key: 'recruiter-referral-link' }
              ].map(({ label, url, value, key }) => (
                <div key={key} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/50 mb-0.5">{label}</p>
                    <p className="text-sm text-blue-300 font-mono truncate">{value || url}</p>
                  </div>
                  <button onClick={() => copy(value || url, key)}
                    className="shrink-0 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-blue-300 text-xs px-3 py-1.5 rounded-lg transition-colors">
                    {copied === key ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => copy(rec.proReferralLink || rec.recruiterLink, 'copy-pro-link')}
                className="bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-blue-200 text-xs px-3 py-2 rounded-lg transition-colors"
              >
                {copied === 'copy-pro-link' ? '✓ Copied' : 'Copy Pro Link'}
              </button>
              <button
                onClick={() => copy(rec.recruiterReferralLink || rec.recruiterRecruiterLink, 'copy-recruiter-link')}
                className="bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-blue-200 text-xs px-3 py-2 rounded-lg transition-colors"
              >
                {copied === 'copy-recruiter-link' ? '✓ Copied' : 'Copy Recruiter Link'}
              </button>
              <button
                onClick={() => generateOneTimeCode('pro')}
                disabled={generating === 'pro'}
                className="bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/30 text-emerald-200 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {generating === 'pro' ? 'Generating…' : 'Generate One-Time Pro Code'}
              </button>
              <button
                onClick={() => generateOneTimeCode('recruiter')}
                disabled={generating === 'recruiter'}
                className="bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/30 text-purple-200 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {generating === 'recruiter' ? 'Generating…' : 'Generate One-Time Recruiter Code'}
              </button>
            </div>
            {(latestCodes.pro || latestCodes.recruiter) && (
              <div className="mt-4 space-y-2 text-xs">
                {latestCodes.pro && (
                  <p className="text-emerald-300">
                    New Pro Code Link: <span className="font-mono">{latestCodes.pro}</span>
                  </p>
                )}
                {latestCodes.recruiter && (
                  <p className="text-purple-300">
                    New Recruiter Code Link: <span className="font-mono">{latestCodes.recruiter}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Direct Pros Referred" value={stats.totalReferrals} icon="👥" color="blue" />
            <StatCard label="Active Pros" value={stats.activeReferrals} icon="✅" color="green" />
            <StatCard label="Referred Recruiters" value={stats.recruitersReferred} icon="🤝" color="purple" />
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
