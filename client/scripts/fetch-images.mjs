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

const SERVICES = [
  { file: "service-plumbing.jpg",    query: "plumber in home fixing sink kitchen bright" },
  { file: "service-electrical.jpg",  query: "electrician working at breaker panel home bright" },
  { file: "service-cleaning.jpg",    query: "house cleaner vacuum living room residential bright" },
  { file: "service-roofing.jpg",     query: "roofer installing shingles residential house daytime" },
  { file: "service-hvac.jpg",        query: "hvac technician checking outdoor ac unit residential" },
  { file: "service-carpentry.jpg",   query: "carpenter measuring wood home workshop" },
  { file: "service-painting.jpg",    query: "painter rolling interior wall residential bright" },
  { file: "service-landscaping.jpg", query: "landscaper mowing lawn front yard residential sunny" },
  { file: "service-junk-removal.jpg",query: "junk removal loading furniture truck driveway home" },
  { file: "service-decks.jpg",       query: "contractor building backyard deck residential sunny" },
  { file: "service-handyman.jpg",    query: "handyman using drill fixing door hinge inside house" }
];

const BANNERS = [
  { file: "hero-pro.jpg",      query: "handyman inside home bright smiling" },
  { file: "how-it-works.jpg",  query: "homeowner couple with contractor tablet living room bright" }
];

const PEXELS_KEY = process.env.PEXELS_API_KEY || "";
const headers = PEXELS_KEY ? { Authorization: PEXELS_KEY } : null;

// Helpers
async function downloadTo(filePath, res) {
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const dest = fs.createWriteStream(filePath);
  await streamPipeline(res.body, dest);
}

async function fetchPexelsPhoto(query, w, h) {
  if (!PEXELS_KEY) return null;
  const url = new URL("https://api.pexels.com/v1/search"); // Pexels Photos Search
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", w >= h ? "landscape" : "portrait");
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Pexels search ${res.status}`);
  const data = await res.json();
  const photo = data.photos?.[0];
  if (!photo) return null;
  // Prefer 'large' or 'medium' sizes
  const link = photo.src?.large || photo.src?.medium || photo.src?.original;
  return link || null;
}

function picsumUrl(w, h, seed) {
  // stable seed per filename so images don't change every build
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

async function saveImage(filename, primaryUrl, fallbackUrl) {
  const filePath = path.join(outDir, filename);
  try {
    if (primaryUrl) {
      const res = await fetch(primaryUrl, { redirect: "follow" });
      await downloadTo(filePath, res);
      console.log("✓ saved", filename, "(primary)");
      return;
    }
    throw new Error("no primary url");
  } catch (e) {
    try {
      const res2 = await fetch(fallbackUrl, { redirect: "follow" });
      await downloadTo(filePath, res2);
      console.log("✓ saved", filename, "(fallback)");
    } catch (e2) {
      console.error("x failed", filename, e2.message);
    }
  }
}

// Main
(async () => {
  // Banners: 1200x675 (16:9)
  for (const b of BANNERS) {
    const pexelsUrl = await fetchPexelsPhoto(b.query, 1200, 675).catch(() => null);
    const fallback = picsumUrl(1200, 675, b.file);
    await saveImage(b.file, pexelsUrl, fallback);
  }
  // Services: 1200x900 (4:3)
  for (const s of SERVICES) {
    const pexelsUrl = await fetchPexelsPhoto(s.query, 1200, 900).catch(() => null);
    const fallback = picsumUrl(1200, 900, s.file);
    await saveImage(s.file, pexelsUrl, fallback);
  }
})();
