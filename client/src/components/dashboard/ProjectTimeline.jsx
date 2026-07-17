import React, { useMemo } from 'react';

const ICONS = {
  created: '📋',
  assigned: '👷',
  viewed: '👁️',
  accepted: '✅',
  customer_contacted: '📞',
  appointment_scheduled: '📅',
  in_progress: '🔧',
  completed: '🏆',
  reviewed: '⭐',
  closed: '🔒',
  cancelled: '❌',
  invoice_generated: '📄',
  payment_received: '💰'
};

function formatTimestamp(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString();
}

export default function ProjectTimeline({ events = [], loading = false }) {
  const normalizedEvents = useMemo(() => {
    return (Array.isArray(events) ? events : [])
      .slice()
      .sort((a, b) => new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0));
  }, [events]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        Loading activity...
      </div>
    );
  }

  if (!normalizedEvents.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-slate-700">No activity yet</p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-0">
        {normalizedEvents.map((item, index) => (
          <div key={item.id || item._id || `${item.event}-${item.createdAt}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="relative flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">
                {ICONS[item.event] || 'ℹ️'}
              </div>
              {index < normalizedEvents.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
            </div>
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.title || item.event}</h4>
                  <p className="mt-1 text-sm text-slate-600">{item.description || 'Project activity updated.'}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{formatTimestamp(item.createdAt || item.timestamp)}</span>
              </div>
              {item.metadata && Object.keys(item.metadata).length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <span key={key} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500 shadow-sm">
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
