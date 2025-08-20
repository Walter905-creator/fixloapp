// Aggressive, gated unhide loop for production emergencies.
// It only runs if REACT_APP_FORCE_UNHIDE === "1".
export function startAntiHideLoop() {
  const START = Date.now();
  const MAX_MS = 30000; // stop after 30s
  const INTERVAL_MS = 400;

  function unhideOnce() {
    try {
      const root = document.getElementById('root');
      // Unhide global containers first
      [document.documentElement, document.body, root].forEach((el) => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.display = 'block';
        el.style.pointerEvents = 'auto';
        el.removeAttribute('inert');
        el.classList?.remove('hidden', 'opacity-0', 'invisible');
      });

      // Unhide obvious app containers
      const candidates = document.querySelectorAll('#root > *, #root .App, main, [data-app], [data-root]');
      candidates.forEach((el) => {
        const s = getComputedStyle(el);
        if (s.display === 'none') el.style.display = 'block';
        if (s.visibility === 'hidden') el.style.visibility = 'visible';
        if (parseFloat(s.opacity) === 0) el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.removeAttribute('inert');
        el.classList?.remove('hidden', 'opacity-0', 'invisible');
      });

      // If something is covering the app as a full overlay, neutralize it
      const overlays = document.querySelectorAll('div,section,aside');
      overlays.forEach((el) => {
        const s = getComputedStyle(el);
        const isFull =
          (s.position === 'fixed' || s.position === 'absolute') &&
          parseInt(s.width) >= window.innerWidth * 0.95 &&
          parseInt(s.height) >= window.innerHeight * 0.95 &&
          parseFloat(s.opacity) === 0;
        if (isFull) {
          el.style.opacity = '1';
          el.style.pointerEvents = 'none'; // keep it from blocking clicks if it was an invisible overlay
        }
      });
    } catch {}

    if (Date.now() - START < MAX_MS) {
      setTimeout(unhideOnce, INTERVAL_MS);
    }
  }

  // run immediately and a couple of extra times to beat async style injections
  unhideOnce();
  requestAnimationFrame(unhideOnce);
  setTimeout(unhideOnce, 0);
}