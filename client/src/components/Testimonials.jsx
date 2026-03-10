import React from "react";

const CONTRACTOR_TESTIMONIALS = [
  {
    quote: "Got my first job in 24 hours.",
    name: "Mike R.",
    location: "Charlotte",
  },
  {
    quote: "No more paying per lead.",
    name: "Carlos M.",
    location: "Dallas",
  },
  {
    quote: "Great platform for steady work.",
    name: "James L.",
    location: "Miami",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-3" aria-label="5 stars">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container-xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            What Contractors Are Saying
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Tradespeople across the country are growing their businesses with Fixlo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {CONTRACTOR_TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6 flex flex-col">
              <StarRating />
              <p className="text-slate-700 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: "#2ecc71" }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
