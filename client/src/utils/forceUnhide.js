export function forceUnhide() {
  try {
    const els = [document.body, document.getElementById('root')].filter(Boolean);
    els.forEach(el => {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.display = 'block';
      el.classList?.remove('hidden','opacity-0','invisible');
    });
  } catch (e) {
    // ignore
  }
}