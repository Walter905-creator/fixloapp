import React from 'react';

const DISMISSED_KEY = 'fixlo-install-prompt-dismissed';

export default function InstallFixloPrompt() {
  const [event, setEvent] = React.useState(null);
  const [showHelp, setShowHelp] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === 'yes'; } catch { return false; }
  });
  const [installed, setInstalled] = React.useState(() =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  );

  React.useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setEvent(e); };
    const onInstalled = () => { setInstalled(true); setEvent(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const supportsInstall = !!event || isiOS;
  if (installed || dismissed || !supportsInstall) return null;

  async function install() {
    if (!event) { setShowHelp(true); return; }
    const pending = event;
    setEvent(null);
    try { await pending.prompt(); await pending.userChoice; } catch { setShowHelp(true); }
  }

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, 'yes'); } catch { /* unavailable */ }
  }

  return (
    <aside aria-label="Instalar Fixlo" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
      <button type="button" onClick={dismiss} aria-label="Cerrar" className="absolute right-3 top-2 text-xl">×</button>
      <div className="flex items-center gap-3"><img src="/logo.png" alt="Fixlo" className="h-10 w-10 rounded-lg object-contain" /><p className="pr-5 font-semibold">Add Fixlo to your home screen</p></div>
      <p className="mt-1 text-sm">Open Fixlo in one tap, like an app.</p>
      {showHelp ? (
        <p className="mt-2 text-sm">
          {isiOS ? 'On iPhone, open Fixlo in Safari, tap Share, select Add to Home Screen, then tap Add. Apple requires you to confirm these steps.' : 'Open your browser menu and select Install app or Add to Home screen.'}
        </p>
      ) : null}
      <button type="button" onClick={install} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
        {event ? 'Install Fixlo' : 'How to add Fixlo'}
      </button>
    </aside>
  );
}
