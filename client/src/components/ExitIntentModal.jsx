import React from 'react';

const ExitIntentModal = React.memo(function ExitIntentModal({
  enabled = true,
  title,
  description,
  ctaHref,
  ctaLabel
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia?.('(pointer:fine)').matches) {
      return undefined;
    }

    const storageKey = `fixlo_exit_intent_${window.location.pathname}`;

    const handleMouseOut = (event) => {
      if (sessionStorage.getItem(storageKey) === '1') {
        return;
      }

      if (event.clientY <= 0) {
        setOpen(true);
        sessionStorage.setItem(storageKey, '1');
      }
    };

    window.addEventListener('mouseout', handleMouseOut);
    return () => window.removeEventListener('mouseout', handleMouseOut);
  }, [enabled]);

  if (!enabled || !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto block rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close exit intent modal"
        >
          Close
        </button>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Before you go</p>
        <h3 className="mt-3 text-3xl font-extrabold text-slate-950">{title}</h3>
        <p className="mt-3 text-base text-slate-600">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={ctaHref} onClick={() => setOpen(false)} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            {ctaLabel}
          </a>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
});

export default ExitIntentModal;
