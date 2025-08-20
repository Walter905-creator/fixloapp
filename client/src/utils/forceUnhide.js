export function forceUnhide() {
  try {
    const root = document.getElementById('root');
    const targets = [document.documentElement, document.body, root].filter(Boolean);
    for (const el of targets) {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.display = 'block';
      el.removeAttribute('inert');
      el.classList?.remove('hidden','opacity-0','invisible');
      // Kill any accidental full-screen overlay
      if (getComputedStyle(el).pointerEvents === 'none') el.style.pointerEvents = 'auto';
    }
  } catch {}
}

// Run twice (next tick) to defeat late style injections
export function forceUnhideSoon() {
  forceUnhide();
  setTimeout(forceUnhide, 0);
  requestAnimationFrame(forceUnhide);
}