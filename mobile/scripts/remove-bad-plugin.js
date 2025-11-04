// scripts/remove-bad-plugin.js
// Removes the invalid config plugin file from expo-in-app-purchases before EAS reads app config

import fs from "fs";
import path from "path";

const pluginPath = path.join(
  "node_modules",
  "expo-in-app-purchases",
  "app.plugin.js"
);

try {
  if (fs.existsSync(pluginPath)) {
    fs.rmSync(pluginPath);
    console.log("🧩 Removed invalid expo-in-app-purchases app.plugin.js");
  } else {
    console.log("✅ No invalid plugin found — nothing to remove");
  }
} catch (err) {
  console.error("⚠️ Failed to remove invalid plugin:", err);
  process.exit(0); // don’t break the build
}
