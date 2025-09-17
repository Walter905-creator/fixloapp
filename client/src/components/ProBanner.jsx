import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PRO_BANNER_ENABLED, PRO_BANNER_COPY } from "../config/proBanner";

const STORAGE_KEY = "hide_pro_banner_v1";

export default function ProBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Show unless user previously dismissed
    const isHidden = localStorage.getItem(STORAGE_KEY) === "1";
    setHidden(isHidden);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
  };

  if (!PRO_BANNER_ENABLED || hidden) return null;

  return (
    <div className="w-full sticky top-0 z-50">
      <div className="bg-emerald-600 text-white">
        <div className="mx-auto max-w-7xl px-3 py-2 flex items-center justify-between gap-3">
          <p className="text-sm md:text-base font-medium">
            <span className="hidden sm:inline">Pros:</span>{" "}
            <strong>Unlimited job leads</strong> for a flat monthly fee.
          </p>
          <div className="flex items-center gap-2">
            <Link
              to={PRO_BANNER_COPY.url}
              className="inline-block rounded-md bg-white/95 text-emerald-700 px-3 py-1.5 text-sm font-semibold hover:bg-white transition"
              onClick={() => window?.gtag?.("event", "click_pro_banner_join")}
            >
              {PRO_BANNER_COPY.cta}
            </Link>
            <button
              aria-label="Dismiss"
              className="text-white/90 hover:text-white text-xl leading-none px-1"
              onClick={dismiss}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}