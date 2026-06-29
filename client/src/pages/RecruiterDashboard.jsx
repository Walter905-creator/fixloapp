import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import { fetchRecruiterDashboard } from '../lib/api';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MetricCard from '../components/dashboard/MetricCard';
import DashboardTable from '../components/dashboard/DashboardTable';
import EmptyState from '../components/dashboard/EmptyState';
import StatusBadge from '../components/dashboard/StatusBadge';
import LoadingState from '../components/dashboard/LoadingState';
import ErrorState from '../components/dashboard/ErrorState';
import ReferralSourceChart from '../components/dashboard/ReferralSourceChart';
import WeeklyBarChart from '../components/dashboard/WeeklyBarChart';
import CopyLinkCard from '../components/dashboard/CopyLinkCard';
import '../styles/dashboard.css';

function toMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((value || 0) / 100);
}

export default function RecruiterDashboard() {
  const { recruiter, logout } = useRecruiterAuth();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, error: '', data: null });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchRecruiterDashboard({ userId: searchParams.get('userId') || '' });
      setState({ loading: false, error: '', data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, [searchParams]);

  React.useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => state.data?.referrals || [], [state.data]);

  if (state.loading) return <LoadingState message="Loading recruiter dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const data = state.data;

  return (
    <DashboardLayout
      title="Recruiter Dashboard"
      userName={data?.user?.name || recruiter?.name}
      dateRange="Last 7 days"
      onLogout={logout}
      navItems={['Overview', 'Referrals', 'Commissions', 'Payouts', 'Profile', 'Settings', 'Support', 'Log Out']}
    >
      <section className="dashboard-grid metrics-grid">
        <MetricCard label="Total referrals (7d)" value={data?.summary?.totalReferrals ?? 0} />
        <MetricCard label="Converted pros" value={data?.summary?.convertedPros ?? 0} />
        <MetricCard label="Conversion rate" value={`${data?.summary?.conversionRate ?? 0}%`} />
        <MetricCard label="Total commission" value={toMoney(data?.summary?.totalCommission)} />
        <MetricCard label="Pending commission" value={toMoney(data?.summary?.pendingCommission)} />
      </section>

      <section className="dashboard-grid chart-grid">
        <WeeklyBarChart data={data?.weekly || []} valueKey="referrals" title="Weekly Referrals" />
        <ReferralSourceChart data={data?.sources || []} />
        <CopyLinkCard
          title="Your Referral Link"
          value={data?.user?.referralLink}
          subtitle={`Code: ${data?.user?.referralCode || 'N/A'}`}
        />
      </section>

      <DashboardTable
        title="Referral Details"
        rows={rows}
        empty={<EmptyState title="No referrals yet" message="Share your recruiter link to start receiving referrals." />}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'trade', label: 'Trade' },
          { key: 'location', label: 'Location' },
          { key: 'dateReferred', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : '—' },
          { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
          { key: 'commission', label: 'Commission', render: (value) => toMoney(value) }
        ]}
      />
    </DashboardLayout>
  );
}
