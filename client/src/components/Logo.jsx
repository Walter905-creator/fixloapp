import React from "react";
import Logo2025 from "../assets/fixlo-2025-logo.svg";
export default function Logo({ className = "h-10 w-auto md:h-12", alt = "Fixlo 2025 Logo" }) {
  return <img src={Logo2025} alt={alt} className={className} />;
}
