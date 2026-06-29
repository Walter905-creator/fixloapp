import React from 'react';

export default function WeeklyBarChart({ data = [], valueKey = 'referrals', title = 'Weekly Activity' }) {
  const maxValue = Math.max(1, ...data.map((d) => d[valueKey] || 0));

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header"><h3>{title}</h3></div>
      {data.length === 0 ? (
        <div className="chart-empty">No weekly data yet.</div>
      ) : (
        <div className="bar-chart">
          {data.map((point) => {
            const height = Math.max(6, ((point[valueKey] || 0) / maxValue) * 100);
            return (
              <div className="bar-item" key={point.date}>
                <div className="bar-value">{point[valueKey] || 0}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${height}%` }} />
                </div>
                <div className="bar-label">{point.label || point.date}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
