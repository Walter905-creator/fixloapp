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

const PEXELS_KEY = process.env.PEXELS_API_KEY || "";
if (!PEXELS_KEY) {
  console.log(
    "[fetch-images] PEXELS_API_KEY is not set. Will use existing images if available."
  );
}

const headers = { Authorization: PEXELS_KEY };

// Banners (16:9)
const BANNERS = [
  {
    file: "hero-pro.jpg",
    query:
      "handyman helping homeowner inside house smiling bright residential couple",
    w: 1200,
    h: 675,
  },
  {
    file: "how-it-works.jpg",
    query:
      "contractor consulting homeowners tablet living room bright residential",
    w: 1200,
    h: 675,
  },
];

// Services (4:3)
const SERVICES = [
  {
    file: "service-plumbing.jpg",
    query: "plumber fixing sink kitchen residential smiling",
    w: 1200,
    h: 900,
  },
  {
    file: "service-electrical.jpg",
    query: "electrician working breaker panel home residential",
    w: 1200,
    h: 900,
  },
  {
    file: "service-cleaning.jpg",
    query: "house cleaner vacuum living room residential bright",
    w: 1200,
    h: 900,
  },
  {
    file: "service-roofing.jpg",
    query: "roofer installing shingles small house residential daytime",
    w: 1200,
    h: 900,
  },
  {
    file: "service-hvac.jpg",
    query: "hvac technician checking ac unit residential exterior",
    w: 1200,
    h: 900,
  },
  {
    file: "service-carpentry.jpg",
    query: "carpenter measuring wood home workshop residential",
    w: 1200,
    h: 900,
  },
  {
    file: "service-painting.jpg",
    query: "painter rolling interior wall home bright residential",
    w: 1200,
    h: 900,
  },
  {
    file: "service-landscaping.jpg",
    query: "landscaper mowing lawn trimming hedges residential sunny",
    w: 1200,
    h: 900,
  },
  {
    file: "service-junk-removal.jpg",
    query:
      "junk removal loading furniture small truck driveway home residential",
    w: 1200,
    h: 900,
  },
  {
    file: "service-decks.jpg",
    query: "contractor building backyard deck residential sunny",
    w: 1200,
    h: 900,
  },
  {
    file: "service-handyman.jpg",
    query:
      "handyman using drill fixing door hinge inside house residential",
    w: 1200,
    h: 900,
  },
];

async function searchPexels(query, w, h) {
  if (!PEXELS_KEY) return null;
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "8");
  url.searchParams.set("orientation", w >= h ? "landscape" : "portrait");
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Pexels search failed: ${res.status}`);
  const data = await res.json();
  // prefer people, indoor, bright-ish
  const pick =
    data.photos?.find((p) => p.src?.large) ||
    data.photos?.[0];
  return pick?.src?.large || pick?.src?.medium || pick?.src?.original || null;
}

async function downloadVerified(url, destPath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) throw new Error(`Not image: ${ct}`);
  const tmp = destPath + ".tmp";
  await streamPipeline(res.body, fs.createWriteStream(tmp));
  const { size } = fs.statSync(tmp);
  if (size < 4096) {
    fs.unlinkSync(tmp);
    throw new Error("too small (likely placeholder)");
  }
  fs.renameSync(tmp, destPath);
}

async function ensureOne(file, query, w, h) {
  const to = path.join(outDir, file);
  
  // Check if file already exists
  if (fs.existsSync(to)) {
    console.log(`[fetch-images] ✓ ${file} already exists, skipping`);
    return;
  }
  
  if (!PEXELS_KEY) {
    console.warn(`[fetch-images] Skipping ${file}; no PEXELS_API_KEY and file doesn't exist`);
    return;
  }
  const url = await searchPexels(query, w, h);
  if (!url) throw new Error("no search result");
  await downloadVerified(url, to);
  console.log("✓ saved", file);
}

(async () => {
  try {
    for (const b of BANNERS) await ensureOne(b.file, b.query, b.w, b.h);
    for (const s of SERVICES) await ensureOne(s.file, s.query, s.w, s.h);
  } catch (e) {
    console.error("[fetch-images] Fatal:", e.message);
    process.exitCode = 0; // don’t fail the whole build
  }
})();
