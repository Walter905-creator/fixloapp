import React from 'react';

export default function MetricCard({ label, value, helper }) {
  return (
    <article className="dashboard-card metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {helper ? <p className="metric-helper">{helper}</p> : null}
    </article>
  );
}
