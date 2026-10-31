// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["fixlo-icon.svg"],
      manifest: {
        name: "Fixlo — Home Services",
        short_name: "Fixlo",
        description: "Trusted home services, projects and checklists",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#059669",
        icons: [
          { src: "/fixlo-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/assets\//],
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 3000000
      }
    })
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } }
});
