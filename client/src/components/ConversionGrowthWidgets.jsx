import React from 'react';
import { Link } from 'react-router-dom';

const HOMEOWNER_NOTIFICATIONS = [
  'John from Charlotte just booked landscaping.',
  'A homeowner in Austin just requested emergency plumbing.',
  '12 jobs available near you.',
  '3 contractors joined today.',
  'Recent completed job: AC repair in Dallas.',
];

const PRO_NOTIFICATIONS = [
  '3 contractors joined today.',
  '12 jobs available near you.',
  'Recent completed job: Junk removal in Miami.',
  'A homeowner in Phoenix needs painting today.',
  'New signup: Electrician from Atlanta.',
];

export default function ConversionGrowthWidgets({
  audience = 'homeowner',
  ctaText = 'Get Started',
  ctaLink = '/request',
}) {
  const notifications = audience === 'pro' ? PRO_NOTIFICATIONS : HOMEOWNER_NOTIFICATIONS;
  const [index, setIndex] = React.useState(0);
  const [showExitIntent, setShowExitIntent] = React.useState(false);
  const [showMobileSticky, setShowMobileSticky] = React.useState(true);
  const canUseFinePointer = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer:fine)').matches,
    []
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % notifications.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [notifications.length]);

  React.useEffect(() => {
    const onMouseOut = (event) => {
      const alreadyShown = sessionStorage.getItem('fixlo_exit_intent_shown') === '1';
      if (!canUseFinePointer || alreadyShown) return;
      if (event.clientY <= 0) {
        setShowExitIntent(true);
        sessionStorage.setItem('fixlo_exit_intent_shown', '1');
      }
    };
    window.addEventListener('mouseout', onMouseOut);
    return () => window.removeEventListener('mouseout', onMouseOut);
  }, [canUseFinePointer]);

  return (
    <>
      <section className="bg-slate-900 text-white py-4 border-y border-slate-700">
        <div className="container-xl grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-lg bg-white/10 px-3 py-2">⚡ Get help in minutes</div>
          <div className="rounded-lg bg-white/10 px-3 py-2">🔥 Limited spots available in top zip codes</div>
          <div className="rounded-lg bg-white/10 px-3 py-2">✅ Social proof: {notifications[index]}</div>
        </div>
      </section>

      {showExitIntent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              type="button"
              className="float-right text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand rounded px-2 py-1"
              onClick={() => setShowExitIntent(false)}
              aria-label="Close exit modal"
            >
              Close
            </button>
            <h3 className="text-2xl font-bold text-slate-900">Before you go...</h3>
            <p className="text-sm text-slate-600 mt-2">
              {audience === 'pro'
                ? 'Get customers ready to hire and build a steady stream of jobs.'
                : 'Fixlo connects you with trusted local professionals for your home projects.'}
            </p>
            <div className="mt-5 flex gap-3">
              <Link to={ctaLink} className="btn-primary px-5 py-2 text-sm" onClick={() => setShowExitIntent(false)}>
                {ctaText}
              </Link>
              <button className="btn-ghost px-5 py-2 text-sm" onClick={() => setShowExitIntent(false)}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {showMobileSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200 bg-white/95 backdrop-blur p-3">
          <div className="flex items-center gap-2">
            <Link to={ctaLink} className="btn-primary w-full py-3 text-base text-center">
              {ctaText}
            </Link>
            <button
              type="button"
              className="btn-ghost px-3 py-3 text-sm"
              onClick={() => setShowMobileSticky(false)}
              aria-label="Dismiss sticky CTA"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
