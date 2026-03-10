import React from "react";
import { useNavigate } from "react-router-dom";

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 bg-slate-900">
      <div className="container-xl text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Start Getting Job Leads Today
        </h2>
        <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">
          Join thousands of contractors already growing their business with Fixlo. No bidding. No per-lead fees.
        </p>
        <div className="mt-8">
          <button
            onClick={() => navigate("/join")}
            className="inline-block text-white font-semibold text-xl px-12 py-5 rounded-full shadow-xl transition-colors"
            style={{ backgroundColor: "#2ecc71" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#27ae60")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2ecc71")}
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}
