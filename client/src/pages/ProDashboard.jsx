import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchProDashboard } from '../lib/api';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MetricCard from '../components/dashboard/MetricCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import EmptyState from '../components/dashboard/EmptyState';
import StatusBadge from '../components/dashboard/StatusBadge';
import LoadingState from '../components/dashboard/LoadingState';
import ErrorState from '../components/dashboard/ErrorState';
import WeeklyBarChart from '../components/dashboard/WeeklyBarChart';
import CopyLinkCard from '../components/dashboard/CopyLinkCard';
import { formatUsdCents } from '../lib/format';
import '../styles/dashboard.css';

function toMoney(value) {
  return formatUsdCents(value);
}

export default function ProDashboard() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, error: '', data: null });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchProDashboard({ userId: searchParams.get('userId') || '' });
      setState({ loading: false, error: '', data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, [searchParams]);

  React.useEffect(() => { load(); }, [load]);

  const leads = useMemo(() => state.data?.leads || [], [state.data]);
  const recentRequests = useMemo(() => state.data?.recentRequests || [], [state.data]);

  if (state.loading) return <LoadingState message="Loading pro dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const data = state.data;

  return (
    <DashboardLayout
      title="Pro Dashboard"
      userName={data?.user?.name || user?.name}
      dateRange="Last 7 days"
      onLogout={logout}
      navItems={['Overview', 'Leads', 'Earnings', 'Billing', 'Profile', 'Settings', 'Support', 'Log Out']}
    >
      <section className="dashboard-grid metrics-grid">
        <MetricCard label="New leads" value={data?.summary?.newLeads ?? 0} />
        <MetricCard label="Accepted jobs" value={data?.summary?.acceptedJobs ?? 0} />
        <MetricCard label="Pending quotes" value={data?.summary?.pendingQuotes ?? 0} />
        <MetricCard label="Estimated earnings" value={toMoney(data?.summary?.estimatedEarnings)} />
        <MetricCard label="SMS notifications" value={data?.summary?.smsEnabled ? 'Enabled' : 'Disabled'} />
        <MetricCard label="Subscription" value={data?.summary?.subscriptionStatus || 'N/A'} />
        <MetricCard label="Checkr" value={data?.summary?.checkrStatus || 'N/A'} />
      </section>

      <section className="dashboard-grid chart-grid">
        <WeeklyBarChart data={recentRequests} valueKey="count" title="Recent Service Requests" />
        <CopyLinkCard
          title="Billing"
          value={data?.billing?.stripeCustomerId || ''}
          subtitle={`Status: ${data?.billing?.subscriptionStatus || 'N/A'} • Period end: ${data?.billing?.currentPeriodEnd ? new Date(data.billing.currentPeriodEnd).toLocaleDateString() : 'N/A'}`}
        />
      </section>

      <DashboardTable
        title="Lead Details"
        rows={leads}
        empty={<EmptyState title="No leads yet" message="Your lead pipeline is empty right now." />}
        columns={[
          { key: 'customerName', label: 'Customer' },
          { key: 'service', label: 'Service' },
          { key: 'location', label: 'Location' },
          { key: 'dateRequested', label: 'Requested', render: (value) => value ? new Date(value).toLocaleDateString() : '—' },
          { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
          { key: 'estimatedValue', label: 'Est. Value', render: (value) => toMoney(value) },
          { key: 'phone', label: 'Phone', render: (value) => value || '—' }
        ]}
      />
    </DashboardLayout>
  );
}
