import { useNavigate } from "react-router-dom";

export default function ProValueBanner({ dense = false }) {
  const navigate = useNavigate();
  const base = dense ? "py-4" : "py-6 md:py-8";
  const h = dense ? "text-xl md:text-2xl" : "text-2xl md:text-3xl";
  const p = dense ? "text-sm md:text-base" : "text-base md:text-lg";

  return (
    <section
      role="region"
      aria-label="Fixlo Pro value"
      className={`w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white ${base}`}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-3 md:gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className={`${h} font-semibold`}>
              $59/month, unlimited job leads, texted straight to your phone.
            </h2>
            <p className={`${p} opacity-95`}>
              No per-lead fees. Keep 100% of what you earn.
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm opacity-90">
              <li>• Flat monthly fee</li>
              <li>• Local job alerts</li>
              <li>• Cancel anytime</li>
            </ul>
          </div>
          <div className="justify-self-start md:justify-self-end">
            <button
              type="button"
              onClick={() => navigate("/pro/signup")}
              className="inline-flex items-center rounded-2xl px-5 py-3 text-base font-semibold bg-white text-emerald-700 shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="Join Fixlo Pro Today"
            >
              Join Fixlo Pro Today
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}