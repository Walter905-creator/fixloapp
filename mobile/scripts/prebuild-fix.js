// scripts/prebuild-fix.js
const fs = require("fs");
const path = require("path");

const moduleRoot = path.join(__dirname, "..", "node_modules", "expo-in-app-purchases");
const file = path.join(moduleRoot, "app.plugin.js");

try {
  fs.mkdirSync(moduleRoot, { recursive: true });
  fs.writeFileSync(
    file,
    `// auto-generated dummy plugin to bypass build error
module.exports = function withNoopPlugin(config) {
  console.log("🧩 Skipping invalid expo-in-app-purchases plugin.");
  return config;
};`
  );
  console.log("✅  Replaced broken expo-in-app-purchases plugin with dummy.");
} catch (e) {
  console.error("⚠️  Failed to patch expo-in-app-purchases plugin:", e);
}
