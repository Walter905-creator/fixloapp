// scripts/bumpVersion.js
const fs = require("fs");
const path = require("path");

// Detect app.json location automatically (works in both root and /mobile)
const possiblePaths = [
  path.join(__dirname, "..", "app.json"),
  path.join(__dirname, "..", "..", "app.json")
];

let filePath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    filePath = p;
    break;
  }
}

if (!filePath) {
  console.error("❌ app.json not found in expected locations!");
  process.exit(1);
}

console.log(`🧭 Using app.json from: ${filePath}`);

const appJson = JSON.parse(fs.readFileSync(filePath, "utf8"));

// Ensure structure exists
if (!appJson.expo) appJson.expo = {};
if (!appJson.expo.ios) appJson.expo.ios = {};
if (!appJson.expo.android) appJson.expo.android = {};

// --- Increment version ---
const oldVersion = appJson.expo.version || "1.0.0";
const versionParts = oldVersion.split(".");
versionParts[2] = (parseInt(versionParts[2] || "0") + 1).toString();
const newVersion = versionParts.join(".");

// --- Increment iOS buildNumber ---
const oldIosBuild = parseInt(appJson.expo.ios.buildNumber || "1");
const newIosBuild = oldIosBuild + 1;

// --- Increment Android versionCode ---
const oldAndroidCode = parseInt(appJson.expo.android.versionCode || "1");
const newAndroidCode = oldAndroidCode + 1;

// --- Apply updates ---
appJson.expo.version = newVersion;
appJson.expo.ios.buildNumber = newIosBuild.toString();
appJson.expo.android.versionCode = newAndroidCode;

// --- Save changes ---
fs.writeFileSync(filePath, JSON.stringify(appJson, null, 2));

console.log("✅ Version bumped successfully!");
console.log(`📱 Version: ${oldVersion} → ${newVersion}`);
console.log(`🍎 iOS buildNumber: ${oldIosBuild} → ${newIosBuild}`);
console.log(`🤖 Android versionCode: ${oldAndroidCode} → ${newAndroidCode}`);
console.log("✅ app.json updated successfully!");
