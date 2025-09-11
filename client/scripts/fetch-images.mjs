// Fetch bright residential stock-style photos at build and serve them locally.
// No API keys needed (uses Unsplash Source). Sizes: 16:9 for hero/how-it-works, 4:3 for services.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const streamPipeline = promisify(pipeline);

const outDir = path.join(__dirname, "..", "public", "images");
fs.mkdirSync(outDir, { recursive: true });

const items = [
  // 16:9
  { file: "hero-pro.jpg",        url: "https://source.unsplash.com/1200x675/?handyman,residential,inside%20home,bright,smiling,no%20hardhat" },
  { file: "how-it-works.jpg",    url: "https://source.unsplash.com/1200x675/?homeowner%20couple,contractor,living%20room,tablet,residential,bright" },

  // 4:3 services
  { file: "service-plumbing.jpg",      url: "https://source.unsplash.com/1200x900/?plumber,fixing%20sink,kitchen,residential,no%20hardhat" },
  { file: "service-electrical.jpg",    url: "https://source.unsplash.com/1200x900/?electrician,breaker%20panel,home,residential,bright" },
  { file: "service-cleaning.jpg",      url: "https://source.unsplash.com/1200x900/?house%20cleaner,vacuum,living%20room,residential,bright" },
  { file: "service-roofing.jpg",       url: "https://source.unsplash.com/1200x900/?roofer,installing%20shingles,house,residential,daylight,no%20hardhat" },
  { file: "service-hvac.jpg",          url: "https://source.unsplash.com/1200x900/?hvac%20technician,ac%20unit,house,residential" },
  { file: "service-carpentry.jpg",     url: "https://source.unsplash.com/1200x900/?carpenter,measuring%20wood,home,garage,workshop,residential" },
  { file: "service-painting.jpg",      url: "https://source.unsplash.com/1200x900/?painter,rolling%20paint,interior,home,residential,bright" },
  { file: "service-landscaping.jpg",   url: "https://source.unsplash.com/1200x900/?landscaper,mowing%20lawn,front%20yard,residential,sunny" },
  { file: "service-junk-removal.jpg",  url: "https://source.unsplash.com/1200x900/?junk%20removal,loading%20furniture,truck,driveway,home" },
  { file: "service-decks.jpg",         url: "https://source.unsplash.com/1200x900/?contractor,building%20deck,backyard,house,residential" },
  { file: "service-handyman.jpg",      url: "https://source.unsplash.com/1200x900/?handyman,drill,door%20hinge,inside%20house,residential" },
];

async function fetchImage({ file, url }) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`Failed ${url}: ${res.status}`);
  const dest = fs.createWriteStream(path.join(outDir, file));
  await streamPipeline(res.body, dest);
  console.log("✓ saved", file);
}

(async () => {
  for (const item of items) {
    try {
      await fetchImage(item);
    } catch (e) {
      console.error("x error", item.file, e.message);
    }
  }
})();
