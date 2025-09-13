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

const BANNERS = [
  { file: "hero-pro.jpg",     q: "handyman inside home bright smiling residential" },
  { file: "how-it-works.jpg", q: "homeowner couple contractor tablet living room bright" }
];

const SERVICES = [
  { file: "service-plumbing.jpg",    q: "plumber fixing sink kitchen residential" },
  { file: "service-electrical.jpg",  q: "electrician breaker panel home bright" },
  { file: "service-cleaning.jpg",    q: "house cleaner vacuum living room bright" },
  { file: "service-roofing.jpg",     q: "roofer installing shingles residential house daytime" },
  { file: "service-hvac.jpg",        q: "hvac technician outdoor ac unit residential" },
  { file: "service-carpentry.jpg",   q: "carpenter measuring wood home workshop" },
  { file: "service-painting.jpg",    q: "painter rolling interior wall residential bright" },
  { file: "service-landscaping.jpg", q: "landscaper mowing lawn front yard residential sunny" },
  { file: "service-junk-removal.jpg",q: "junk removal loading furniture truck driveway home" },
  { file: "service-decks.jpg",       q: "contractor building backyard deck residential sunny" },
  { file: "service-handyman.jpg",    q: "handyman drill fixing door hinge inside house" }
];

const PEXELS_KEY = process.env.PEXELS_API_KEY || ""; // optional
const headers = PEXELS_KEY ? { Authorization: PEXELS_KEY } : undefined;

async function pexelsSearchUrl(query, w, h) {
  if (!PEXELS_KEY) return null;
  const url = new URL("https://api.pexels.com/v1/search"); // official docs :contentReference[oaicite:2]{index=2}
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", w >= h ? "landscape" : "portrait");
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  const p = data?.photos?.[0];
  return p?.src?.large || p?.src?.medium || p?.src?.original || null;
}

function picsum(w, h, seed) {
  // deterministic placeholder — always an image; supports /seed (docs) :contentReference[oaicite:3]{index=3}
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

async function downloadImage(url, toPath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) throw new Error(`Not image: ${ct}`);
  const tmp = toPath + ".tmp";
  await streamPipeline(res.body, fs.createWriteStream(tmp));
  const { size } = fs.statSync(tmp);
  if (size < 2048) { fs.unlinkSync(tmp); throw new Error("too small"); } // avoid blank/0-byte
  fs.renameSync(tmp, toPath);
}

async function ensure(file, query, w, h) {
  const pathOut = path.join(outDir, file);
  try {
    const pex = await pexelsSearchUrl(query, w, h);
    if (pex) { await downloadImage(pex, pathOut); console.log("✓", file, "(pexels)"); return; }
    throw new Error("no pexels key or no result");
  } catch {
    const fallback = picsum(w, h, file);
    try { await downloadImage(fallback, pathOut); console.log("✓", file, "(picsum)"); }
    catch (e2) { console.error("x", file, e2.message); }
  }
}

(async () => {
  for (const b of BANNERS) await ensure(b.file, b.q, 1200, 675);
  for (const s of SERVICES) await ensure(s.file, s.q, 1200, 900);
})();
