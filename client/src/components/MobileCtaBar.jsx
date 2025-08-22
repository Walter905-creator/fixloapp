import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function MobileCtaBar() {
  const { pathname } = useLocation();
  const hideOnThese = ["/pro/signup", "/signup"]; // don't show when already on a form
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile || hideOnThese.includes(pathname)) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-slate-200"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)", // iOS bottom safe area
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex gap-3">
        <Link
          to="/pro/signup"
          className="flex-1 rounded-xl px-4 py-3 text-center bg-slate-900 text-white hover:bg-slate-800"
        >
          Join Now
        </Link>
        <Link
          to="/signup"
          className="flex-1 rounded-xl px-4 py-3 text-center border border-slate-300"
        >
          Request Service
        </Link>
      </div>
    </div>
  );
}