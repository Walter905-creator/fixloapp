import React from "react";
import { useNavigate } from "react-router-dom";

const CONTRACTOR_IMG = "/images/service-handyman.jpg";
const HOUSE_BG_IMG = "/images/how-it-works.jpg";

export default function HeroSection({ headingTag = "h2" }) {
  const navigate = useNavigate();
  const HeadingTag = headingTag;

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "520px" }}
    >
      {/* Background house image with dark gradient overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HOUSE_BG_IMG})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.80) 55%, rgba(15, 23, 42, 0.45) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative container-xl py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left side content */}
          <div className="text-white">
            <p className="text-emerald-400 font-semibold uppercase tracking-widest text-sm mb-3">
              Trusted home services marketplace
            </p>
            <HeadingTag className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Book trusted home services or grow your trade business with Fixlo.
            </HeadingTag>
            <p className="mt-6 text-lg md:text-xl text-slate-200 max-w-2xl">
              Homeowners get matched fast with verified local pros, and contractors get a cleaner path to quality leads without the usual bidding chaos.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Fast homeowner requests', 'Verified local pros', 'Clear routes for every audience'].map((item) => (
                <span key={item} className="pill border-white/40 text-white bg-white/10">{item}</span>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <button
                onClick={() => navigate("/for-homeowners")}
                className="w-full sm:w-auto text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors"
                style={{ backgroundColor: "#2ecc71" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#27ae60")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2ecc71")}
              >
                Find a Pro
              </button>
              <button
                onClick={() => navigate("/for-pros")}
                className="w-full sm:w-auto bg-transparent text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg border-2 border-white transition-colors hover:bg-white hover:text-slate-900"
              >
                Join as a Pro
              </button>
            </div>
          </div>

          {/* Right side contractor image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm lg:max-w-md">
              <img
                src={CONTRACTOR_IMG}
                alt="Professional contractor ready to work"
                className="w-full h-auto object-cover"
                style={{ maxHeight: "420px", objectPosition: "center top" }}
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
