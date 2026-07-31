import React from 'react';
import { useNavigate } from 'react-router-dom';

const HOUSE_BG_IMG = '/images/how-it-works.jpg';

const trustItems = [
  { icon: '⌂', title: 'Trusted Professionals', text: 'Background-checked and verified.' },
  { icon: '◷', title: 'Fast Response', text: 'A pro will contact you within 24 hours.' },
  { icon: '✓', title: 'Quality Work', text: 'Get the job done right the first time.' },
];

export default function HeroSection({ headingTag = 'h2' }) {
  const navigate = useNavigate();
  const HeadingTag = headingTag;

  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HOUSE_BG_IMG})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,.97) 0%, rgba(0,0,0,.84) 44%, rgba(0,0,0,.35) 72%, rgba(0,0,0,.15) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative container-xl grid min-h-[610px] items-center gap-12 py-14 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
        <div className="max-w-2xl">
          <HeadingTag className="text-5xl font-black leading-[.98] tracking-tight sm:text-6xl lg:text-7xl">
            Home projects
            <br />
            made easy.
            <span className="mt-2 block text-amber-400">We’ve got you covered.</span>
          </HeadingTag>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
            From small repairs to big renovations, Fixlo connects you with trusted local professionals who get the job done right.
          </p>

          <div className="mt-9 grid gap-5 sm:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 text-xl font-black text-amber-400">
                  {item.icon}
                </span>
                <div>
                  <p className="font-bold leading-5">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/70">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md lg:ml-auto">
          <div className="rounded-[28px] bg-white p-7 text-center text-slate-950 shadow-2xl sm:p-9">
            <div className="mx-auto -mt-16 mb-4 flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-amber-50 text-3xl text-amber-500 shadow-lg">
              ♙
            </div>
            <h2 className="text-3xl font-black">Request a Service</h2>
            <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-slate-600">
              Tell us about your project and we’ll match you with the right local professional.
            </p>
            <button
              onClick={() => navigate('/request')}
              className="mt-6 flex w-full items-center justify-center gap-4 rounded-xl bg-amber-400 px-6 py-4 text-lg font-black text-black shadow-lg transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-300/40"
            >
              Request a Service <span aria-hidden="true" className="text-3xl leading-none">→</span>
            </button>
            <p className="mt-4 text-sm text-slate-600">▣ &nbsp; Secure. Private. Easy.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
