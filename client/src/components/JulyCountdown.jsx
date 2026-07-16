import React from 'react';
import { getPromoTimeRemaining, isJulyPromoActive } from '../config/julyPromo';

/**
 * JulyCountdown — live countdown timer to July 31, 2026 at 11:59 PM (local time).
 * Renders nothing when the promotion has expired.
 *
 * Props:
 *   className  — optional extra classes for the wrapper
 *   compact    — if true, renders an inline "Offer ends in D:HH:MM:SS" string
 */
export default function JulyCountdown({ className = '', compact = false }) {
  const [time, setTime] = React.useState(getPromoTimeRemaining);

  React.useEffect(() => {
    if (!isJulyPromoActive()) return;

    const id = window.setInterval(() => {
      const next = getPromoTimeRemaining();
      setTime(next);
      if (next.expired) window.clearInterval(id);
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  if (time.expired) return null;

  const pad = (n) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <span className={className}>
        Offer ends in{' '}
        <strong>
          {time.days}d {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
        </strong>
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {[
        { value: time.days, label: 'Days' },
        { value: pad(time.hours), label: 'Hours' },
        { value: pad(time.minutes), label: 'Min' },
        { value: pad(time.seconds), label: 'Sec' },
      ].map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center rounded-xl bg-white/15 px-3 py-2 min-w-[3rem]">
          <span className="text-xl font-extrabold leading-none tabular-nums">{value}</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest opacity-80">{label}</span>
        </div>
      ))}
    </div>
  );
}
