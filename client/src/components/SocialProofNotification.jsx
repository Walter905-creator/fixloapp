import React from 'react';

const SocialProofNotification = React.memo(function SocialProofNotification({
  enabled = true,
  items = [],
  intervalMs = 4200
}) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!enabled || items.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, items.length]);

  if (!enabled || !items.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 left-4 z-30 hidden max-w-sm md:block">
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Live activity</p>
        <p className="mt-2 text-sm font-medium text-slate-900">{items[index]}</p>
      </div>
    </div>
  );
});

export default SocialProofNotification;
