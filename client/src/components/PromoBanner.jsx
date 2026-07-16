import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { isJulyPromoActive, JULY_PROMO } from "../config/julyPromo";
import JulyCountdown from "./JulyCountdown";

const DISMISS_KEY = "promo_banner_dismissed_at"; // stores YYYY-MM-DD when dismissed

function isWithinWindow(startISO, endISO, now = new Date()) {
  if (!startISO || !endISO) return true;
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T23:59:59");
  return now >= start && now <= end;
}

function isDismissedToday() {
  const today = new Date().toISOString().slice(0,10);
  try {
    return localStorage.getItem(DISMISS_KEY) === today;
  } catch { return false; }
}

function dismissForToday() {
  const today = new Date().toISOString().slice(0,10);
  try { localStorage.setItem(DISMISS_KEY, today); } catch {}
}

export default function PromoBanner() {
  const envEnabled = (import.meta.env.VITE_PROMO_ENABLED ?? "false") === "true";
  const start = import.meta.env.VITE_PROMO_START;
  const end = import.meta.env.VITE_PROMO_END;
  const text = import.meta.env.VITE_PROMO_TEXT;
  const ctaText = import.meta.env.VITE_PROMO_CTA_TEXT;
  const baseUrl = import.meta.env.VITE_PROMO_CTA_URL || "/pros/signup";
  const promoCode = import.meta.env.VITE_PROMO_CODE || "";
  const location = useLocation();

  // July promo auto-activates without any env variable changes
  const julyActive = isJulyPromoActive();
  const enabled = envEnabled || julyActive;

  const [hidden, setHidden] = useState(true);

  // Build CTA URL with optional promo code query param
  const ctaUrl = useMemo(() => {
    try {
      const url = new URL(baseUrl, window.location.origin);
      if (promoCode) url.searchParams.set("promo", promoCode);
      return url.pathname + url.search + url.hash;
    } catch {
      return promoCode ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}promo=${encodeURIComponent(promoCode)}` : baseUrl;
    }
  }, [baseUrl, promoCode]);

  useEffect(() => {
    // Re-evaluate visibility on route change (SPAs)
    const within = envEnabled ? isWithinWindow(start, end) : julyActive;
    const dismissedToday = isDismissedToday();
    setHidden(!enabled || !within || dismissedToday);
  }, [enabled, envEnabled, start, end, julyActive, location]);

  const handleDismiss = () => {
    dismissForToday();
    setHidden(true);
  };

  if (hidden) return null;

  // Auto-render the July special when the built-in promo is active
  if (julyActive && !envEnabled) {
    return (
      <div className="w-full sticky top-0 z-[60]">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="mx-auto max-w-7xl px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide shrink-0">
                🎉 July Special
              </span>
              <p className="text-sm md:text-base font-semibold">
                <strong>50% OFF</strong> — Fixlo Pro Membership{" "}
                <span className="line-through opacity-75">{JULY_PROMO.originalPriceFormatted}</span>{" "}
                <strong>{JULY_PROMO.promoPriceFormatted}/mo</strong>. Save {JULY_PROMO.savingsFormatted} this month.
              </p>
              <JulyCountdown compact className="text-xs text-white/90 hidden sm:inline" />
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/pros/signup"
                className="inline-block rounded-md bg-white/95 text-orange-600 px-3 py-1.5 text-sm font-bold hover:bg-white transition whitespace-nowrap"
                onClick={() => window?.gtag?.("event", "click_july_promo_banner")}
              >
                Claim 50% Off
              </Link>
              <button
                aria-label="Dismiss promotion"
                className="text-white/90 hover:text-white text-xl leading-none px-1"
                onClick={handleDismiss}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: env-configured promo banner
  return (
    <div className="w-full sticky top-0 z-[60]">
      <div className="bg-amber-500 text-white">
        <div className="mx-auto max-w-7xl px-3 py-2 flex items-center justify-between gap-3">
          <p className="text-sm md:text-base font-semibold">
            {text || JULY_PROMO.headline}
          </p>
          <div className="flex items-center gap-2">
            <Link
              to={ctaUrl}
              className="inline-block rounded-md bg-white/95 text-amber-700 px-3 py-1.5 text-sm font-bold hover:bg-white transition"
              onClick={() => window?.gtag?.("event", "click_promo_banner")}
            >
              {ctaText || "Claim Offer"}
            </Link>
            <button
              aria-label="Dismiss promo"
              className="text-white/90 hover:text-white text-xl leading-none px-1"
              onClick={handleDismiss}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
