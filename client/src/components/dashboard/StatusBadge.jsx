import React from 'react';

const LABELS = {
  pending: 'Pending',
  converted: 'Converted',
  paid: 'Paid',
  rejected: 'Rejected',
  accepted: 'Accepted',
  active: 'Active',
  inactive: 'Inactive',
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function StatusBadge({ status = 'pending' }) {
  const key = String(status).toLowerCase();
  return <span className={`dashboard-status dashboard-status-${key}`}>{LABELS[key] || status}</span>;
}
