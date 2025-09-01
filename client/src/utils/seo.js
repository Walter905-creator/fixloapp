export const BASE_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://www.fixloapp.com';

export function normalizePath(pathname = '') {
  if (!pathname) return '/';
  // remove query/fragments and trailing slash (except root), force lowercase
  const url = pathname.split('?')[0].split('#')[0];
  const trimmed = url !== '/' ? url.replace(/\/+$/, '') : '/';
  return trimmed.toLowerCase();
}

export function buildCanonical(pathname = '/') {
  const norm = normalizePath(pathname);
  return `${BASE_URL}${norm}`;
}

export function slugify(label = '') {
  return String(label)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function titleCase(s = '') {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function makeTitle({ service, city, state }) {
  if (service && city) return `${titleCase(service)} in ${titleCase(city)} | Fixlo`;
  if (service && state) return `${titleCase(service)} in ${titleCase(state)} | Fixlo`;
  if (service) return `${titleCase(service)} Near You | Fixlo`;
  return 'Fixlo – Book Trusted Home Services';
}

export function makeDescription({ service, city, state }) {
  const where = city ? titleCase(city) : state ? titleCase(state) : 'your area';
  const what = service ? titleCase(service) : 'Home Services';
  return `Book vetted pros for ${what} in ${where}. Fast quotes, background-checked contractors, easy scheduling.`;
}