import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "hide_free_trial_banner_v1";

export default function FreeTrialBanner({ isSubscriber = false }) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Show banner unless user previously dismissed it or is already a subscriber
    const isHidden = localStorage.getItem(STORAGE_KEY) === "1";
    setHidden(isHidden || isSubscriber);
  }, [isSubscriber]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="w-full sticky top-0 z-[55]">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-7xl px-3 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm md:text-base font-medium text-center sm:text-left">
            Try <strong className="font-bold">Fixlo Pro</strong> —{" "}
            <span className="font-bold underline decoration-2 underline-offset-2">
              First month free
            </span>
            . You won't be charged until after your 30-day trial.
          </p>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="inline-block rounded-lg bg-white text-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
              onClick={() => window?.gtag?.("event", "click_free_trial_banner_cta")}
            >
              Get Started
            </Link>
            <button
              aria-label="Dismiss free trial banner"
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
