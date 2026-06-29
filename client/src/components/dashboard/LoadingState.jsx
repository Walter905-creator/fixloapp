import React from 'react';

export default function LoadingState({ message = 'Loading dashboard data...' }) {
  return (
    <div className="dashboard-loading" role="status" aria-live="polite">
      <div className="dashboard-spinner" />
      <p>{message}</p>
    </div>
  );
}
