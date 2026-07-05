import React from 'react';

const UrgencyPopup = React.memo(function UrgencyPopup({
  enabled = true,
  message,
  delayMs = 1800
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || !message) {
      setVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, enabled, message]);

  if (!enabled || !visible || !message) {
    return null;
  }

  return (
    <div className="fixed left-4 right-4 top-20 z-30 md:left-auto md:right-6 md:top-24 md:max-w-sm">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-xl">⏰</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">High-demand window</p>
            <p className="mt-1 text-sm text-amber-800">{message}</p>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-full p-1 text-amber-700 transition hover:bg-amber-100"
            aria-label="Dismiss urgency popup"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
});

export default UrgencyPopup;
