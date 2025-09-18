import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function isWithinWindow(startISO, endISO, now = new Date()) {
  if (!startISO || !endISO) return true;
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T23:59:59");
  return now >= start && now <= end;
}

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
    const within = isWithinWindow(start, end);
    setVisible(enabled && within);
  }, [enabled, start, end, location]);

  if (!visible) return null;

  return (
    <div className="w-full sticky top-0 z-[60]">
      <div className="bg-amber-500 text-white">
        <div className="mx-auto max-w-7xl px-3 py-2 flex items-center justify-between gap-3">
          <p className="text-sm md:text-base font-semibold">{text}</p>
          <Link
            to={ctaUrl}
            className="inline-block rounded-md bg-white/95 text-amber-700 px-3 py-1.5 text-sm font-bold hover:bg-white transition"
            onClick={() => window?.gtag?.("event", "click_promo_banner")}
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}