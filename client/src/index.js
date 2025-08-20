import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Force-unhide in case any CSS/JS guard survived
const unhide = () => {
  const el = document.getElementById("root");
  if (el) {
    el.style.opacity = "1";
    el.style.visibility = "visible";
    el.removeAttribute("aria-hidden");
    el.classList.remove("hidden");
  }
};
unhide();
setTimeout(unhide, 0);
setTimeout(unhide, 500);
setTimeout(unhide, 2000);

const rootEl = document.getElementById("root");
const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
