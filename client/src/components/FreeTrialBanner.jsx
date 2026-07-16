import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isJulyPromoActive, JULY_PROMO } from "../config/julyPromo";
import JulyCountdown from "./JulyCountdown";

const STORAGE_KEY = "hide_pro_banner_v3";

export default function FreeTrialBanner({ isSubscriber = false }) {
  const [hidden, setHidden] = useState(true);
  const [promoActive, setPromoActive] = useState(false);

  useEffect(() => {
    const active = isJulyPromoActive();
    setPromoActive(active);
    const isHidden = localStorage.getItem(STORAGE_KEY) === "1";
    setHidden(isHidden || isSubscriber);
  }, [isSubscriber]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
  };

  if (hidden) return null;

  if (promoActive) {
    return (
      <div className="w-full sticky top-0 z-[55]">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="mx-auto max-w-7xl px-3 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide">
                🎉 {JULY_PROMO.label}
              </span>
              <p className="text-sm md:text-base font-medium">
                <strong className="font-bold">50% OFF</strong> Fixlo Pro Membership —{" "}
                <span className="line-through opacity-75">{JULY_PROMO.originalPriceFormatted}</span>{" "}
                <strong className="font-bold">{JULY_PROMO.promoPriceFormatted}/month</strong>.{" "}
                Save {JULY_PROMO.savingsFormatted} this month.
              </p>
              <JulyCountdown compact className="text-xs text-white/90" />
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/pricing"
                className="inline-block rounded-lg bg-white text-orange-600 px-4 py-2 text-sm font-bold hover:bg-orange-50 transition shadow-sm whitespace-nowrap"
                onClick={() => window?.gtag?.("event", "click_july_promo_banner_cta")}
              >
                Claim 50% Off
              </Link>
              <button
                aria-label="Dismiss promotion banner"
                className="text-white/90 hover:text-white text-2xl leading-none px-2"
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

  return (
    <div className="w-full sticky top-0 z-[55]">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-7xl px-3 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm md:text-base font-medium text-center sm:text-left">
            Join <strong className="font-bold">Fixlo Pro</strong> —{" "}
            <span className="font-bold underline decoration-2 underline-offset-2">
              Start your membership today
            </span>
            . Get instant access to local job leads.
          </p>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="inline-block rounded-lg bg-white text-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
              onClick={() => window?.gtag?.("event", "click_pro_banner_cta")}
            >
              Get Started
            </Link>
            <button
              aria-label="Dismiss pro banner"
              className="text-white/90 hover:text-white text-2xl leading-none px-2"
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
