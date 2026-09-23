import React, { useEffect, useMemo, useState } from 'react';

function formatDuration(ms) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function LiveWorkTimer({ clockInTime, clockOutTime, hourlyRate = 75, compact = false }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!clockInTime || clockOutTime) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [clockInTime, clockOutTime]);

  const elapsedMs = useMemo(() => {
    if (!clockInTime) return 0;
    const start = new Date(clockInTime).getTime();
    const end = clockOutTime ? new Date(clockOutTime).getTime() : now;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
    return Math.max(end - start, 0);
  }, [clockInTime, clockOutTime, now]);

  if (!clockInTime) return null;

  const running = !clockOutTime;
  const hours = elapsedMs / 3600000;
  const estimatedLabor = Math.max(hours, 1) * Number(hourlyRate || 75);

  return (
    <div className={compact
      ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2"
      : "rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
    }>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            {running ? 'Live work timer' : 'Work time'}
          </p>
          <p className={compact ? "mt-1 font-mono text-xl font-black text-slate-900" : "mt-1 font-mono text-3xl font-black text-slate-900"}>
            {formatDuration(elapsedMs)}
          </p>
        </div>
        <span className={running
          ? "rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white"
          : "rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700"
        }>
          {running ? 'CLOCKED IN' : 'CLOCKED OUT'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {'$' + Number(hourlyRate || 75).toFixed(2) + '/hr · Estimated labor $' + estimatedLabor.toFixed(2)}
      </p>
    </div>
  );
}
