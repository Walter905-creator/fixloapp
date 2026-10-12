import React from 'react';
import { Link } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';

export default function NotFoundPage() {
  return (
    <main className="container-xl py-16 text-center text-slate-900">
      <HelmetSEO title="Page not found | Fixlo" robots="noindex, follow" />
      <p className="text-sm font-semibold text-emerald-600">404</p>
      <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
      <p className="mt-4">This page may have moved or is no longer available.</p>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white">Go to Fixlo</Link>
    </main>
  );
}
