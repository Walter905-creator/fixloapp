import React from 'react';

const StickyMobileCTA = React.memo(function StickyMobileCTA({
  enabled = true,
  href,
  label,
  sublabel,
  onDismiss
}) {
  const [visible, setVisible] = React.useState(enabled);

  React.useEffect(() => {
    setVisible(enabled);
  }, [enabled]);

  if (!enabled || !visible || !href || !label) {
    return null;
  }

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <a href={href} className="flex-1 rounded-full bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400">
          {label}
          {sublabel ? <span className="mt-1 block text-xs font-medium text-emerald-50">{sublabel}</span> : null}
        </a>
        <button
          type="button"
          className="rounded-full border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-600"
          onClick={dismiss}
          aria-label="Dismiss sticky call to action"
        >
          ✕
        </button>
      </div>
    </div>
  );
});

export default StickyMobileCTA;
