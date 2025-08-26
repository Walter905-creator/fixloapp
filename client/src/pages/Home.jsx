// client/src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BUILD_STAMP } from "../utils/buildInfo";

export default function Home() {
  return (
    <main id="home" className="flex-1">
      <Helmet>
        <title>Fixlo – Book Trusted Home Services Near You</title>
        <meta 
          name="description" 
          content="Book trusted home services near you. Professional plumbing, electrical, HVAC, carpentry, and more. Verified contractors, transparent pricing." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/" />
      </Helmet>
      {/* Hero */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 mb-6">
            <img
              src={`/assets/brand/fixlo-logo-2025.svg?v=${BUILD_STAMP}`}
              alt="Fixlo"
              className="h-10 w-auto md:h-12"
            />
            <h1 className="text-2xl md:text-3xl font-bold">Welcome to Fixlo</h1>
          </div>

          <p className="text-slate-600 mb-6 max-w-2xl">
            Book trusted home services near you. Plumbing, electrical, HVAC, and more.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center rounded-lg px-4 py-2 text-white"
              style={{ background: "linear-gradient(90deg, #667eea, #764ba2)" }}
            >
              Sign up
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center rounded-lg border px-4 py-2"
              style={{ borderColor: "#e2e8f0" }}
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}