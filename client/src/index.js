// client/src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/mobile-fix.css";
import App from "./App";

function markVisible() {
  try {
    const root = document.getElementById("root");
    if (root) {
      root.style.opacity = "1";
      root.style.visibility = "visible";
    }
    // remove any legacy overlay if present
    document.querySelectorAll(".preloader, .app-overlay, [data-preloader]")
      .forEach(el => el.remove());
  } catch {}
}

if (!window.__FIXLO_MOUNTED__) {
  const container = document.getElementById("root");
  if (!container) {
    console.error("[Fixlo] #root not found");
  } else {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    window.__FIXLO_MOUNTED__ = true;
    console.log("[Fixlo] React mounted");
    markVisible();
  }
} else {
  console.warn("[Fixlo] Prevented double mount");
}

// Nuke any registered service workers (old CRA apps sometimes register)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.().then(regs => {
    regs.forEach(r => r.unregister());
  });
}
