import React from 'react';
import CommissionReferralDashboard from '../components/CommissionReferralDashboard';

/**
 * Commission Referral Page
 * Public page for anyone to earn commissions by referring Pros
 */
export default function CommissionReferralPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <CommissionReferralDashboard />
    </div>
  );
}
