import React from 'react';

export default function ReferralSourceChart({ data = [] }) {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header"><h3>Referral Sources</h3></div>
      {data.length === 0 ? (
        <div className="chart-empty">No referral source data yet.</div>
      ) : (
        <div className="source-chart">
          {data.map((item) => (
            <div className="source-row" key={item.source}>
              <div className="source-meta">
                <span>{item.source || 'Unknown'}</span>
                <span>{item.count}</span>
              </div>
              <div className="source-track">
                <div className="source-fill" style={{ width: `${Math.max(0, Math.min(100, item.percentage || 0))}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
