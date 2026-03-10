import React from "react";
import { useNavigate } from "react-router-dom";

export default function LeadPreview() {
  const navigate = useNavigate();

  return (
    <section className="py-14 md:py-20 bg-slate-50">
      <div className="container-xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            See Available Jobs in Your Area
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Real homeowners are posting service requests right now. Join Fixlo Pro and unlock full contact details.
          </p>
        </div>

        {/* Example lead card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            {/* Card header */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: "#2ecc71" }}
                >
                  New Lead
                </span>
                <span className="text-xs text-slate-400">Posted today</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-3">Deck Repair</h3>
            </div>

            {/* Card details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span><span className="font-medium">Location:</span> Charlotte, NC</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><span className="font-medium">Budget:</span> $800 – $1,200</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><span className="font-medium">Needed:</span> ASAP</span>
              </div>
            </div>

            {/* Blurred contact area */}
            <div className="relative p-5 border-t border-slate-100">
              {/* Blurred content behind overlay */}
              <div className="blur-sm select-none pointer-events-none space-y-2" aria-hidden="true">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>(704) 555-XXXX</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>homeowner@email.com</span>
                </div>
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-b-2xl">
                <svg className="w-5 h-5 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs font-semibold text-slate-500 text-center px-4">
                  Contact info hidden for Fixlo Pro members
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="p-5 border-t border-slate-100">
              <button
                onClick={() => navigate("/join")}
                className="w-full text-white font-semibold py-3 rounded-xl transition-colors"
                style={{ backgroundColor: "#2ecc71" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#27ae60")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2ecc71")}
              >
                Unlock Full Contact Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
