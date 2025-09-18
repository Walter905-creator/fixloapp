import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";



const DISMISS_KEY = "promo_banner_dismissed_at"; // stores YYYY-MM-DD when dismissed

 main
function isWithinWindow(startISO, endISO, now = new Date()) {
  if (!startISO || !endISO) return true;
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T23:59:59");
  return now >= start && now <= end;
}
 copilot/fix-a2bc7149-e268-4076-8edd-20656eb13f7f

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

 main
export default function PromoBanner() {
  const enabled = (import.meta.env.VITE_PROMO_ENABLED ?? "false") === "true";
  const start = import.meta.env.VITE_PROMO_START;
  const end = import.meta.env.VITE_PROMO_END;
  const text = import.meta.env.VITE_PROMO_TEXT || "Free first month — today only";
  const ctaText = import.meta.env.VITE_PROMO_CTA_TEXT || "Claim Free Month";
  const baseUrl = import.meta.env.VITE_PROMO_CTA_URL || "/join";
  const promoCode = import.meta.env.VITE_PROMO_CODE || "";
  const location = useLocation();


  const [visible, setVisible] = useState(false);


  const [hidden, setHidden] = useState(true);

  // Build CTA URL with optional promo code query param
 main
  const ctaUrl = useMemo(() => {
    try {
      const url = new URL(baseUrl, window.location.origin);
      if (promoCode) url.searchParams.set("promo", promoCode);
      return url.pathname + url.search + url.hash;
    } catch {
 copilot/fix-a2bc7149-e268-4076-8edd-20656eb13f7f

      // If baseUrl is relative, just append ?promo=
 main
      return promoCode ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}promo=${encodeURIComponent(promoCode)}` : baseUrl;
    }
  }, [baseUrl, promoCode]);

  useEffect(() => {
 copilot/fix-a2bc7149-e268-4076-8edd-20656eb13f7f
    const within = isWithinWindow(start, end);
    setVisible(enabled && within);
  }, [enabled, start, end, location]);

  if (!visible) return null;

    // Re-evaluate visibility on route change (SPAs)
    const within = isWithinWindow(start, end);
    const dismissedToday = isDismissedToday();
    setHidden(!enabled || !within || dismissedToday);
  }, [enabled, start, end, location]);

  const handleDismiss = () => {
    dismissForToday();
    setHidden(true);
  };

  if (hidden) return null;
 main

  return (
    <div className="w-full sticky top-0 z-[60]">
      <div className="bg-amber-500 text-white">
        <div className="mx-auto max-w-7xl px-3 py-2 flex items-center justify-between gap-3">
 copilot/fix-a2bc7149-e268-4076-8edd-20656eb13f7f
          <p className="text-sm md:text-base font-semibold">{text}</p>
          <Link
            to={ctaUrl}
            className="inline-block rounded-md bg-white/95 text-amber-700 px-3 py-1.5 text-sm font-bold hover:bg-white transition"
            onClick={() => window?.gtag?.("event", "click_promo_banner")}
          >
            {ctaText}
          </Link>

          <p className="text-sm md:text-base font-semibold">
            {text}
          </p>
          <div className="flex items-center gap-2">
            <Link
              to={ctaUrl}
              className="inline-block rounded-md bg-white/95 text-amber-700 px-3 py-1.5 text-sm font-bold hover:bg-white transition"
              onClick={() => window?.gtag?.("event", "click_promo_banner")}
            >
              {ctaText}
            </Link>
            <button
              aria-label="Dismiss promo"
              className="text-white/90 hover:text-white text-xl leading-none px-1"
              onClick={handleDismiss}
            >
              ×
            </button>
          </div>
 main
        </div>
      </div>
    </div>
  );
}