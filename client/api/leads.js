// /api/leads (serverless handler)
import twilio from "twilio";

/** Minimal E.164 normalization. For production-grade validation, use Twilio Lookup. */
function toE164(raw) {
  if (!raw) return null;
  // keep only + and digits
  const s = String(raw).replace(/[^\d+]/g, "");
  // must start with + and have 8–15 digits total (after +)
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

async function readBody(req) {
  // Works for serverless (Next.js / Vercel) and plain Node
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8") || "{}";
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async function handler(req, res) {
  // CORS — be explicit in production
  const origin = process.env.CORS_ORIGIN || "https://www.fixloapp.com";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Parse & validate payload
  const body = await readBody(req);
  console.log("Lead payload:", body); // shows in server logs for debugging

  const { name, phone, service, city, details } = body || {};
  if (!name || !phone || !service) {
    return res.status(400).json({ error: "name, phone, and service are required" });
  }

  const e164 = toE164(phone);
  if (!e164) {
    return res.status(400).json({ error: "phone must be E.164, e.g. +18005551234" });
  }

  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_MESSAGING_SERVICE_SID,
    TWILIO_FROM,
    PROS_NOTIFY_NUMBERS,
    TWILIO_STATUS_CALLBACK_URL
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !(TWILIO_MESSAGING_SERVICE_SID || TWILIO_FROM)) {
    return res.status(500).json({ error: "Twilio env vars missing (Account SID, Auth Token, and from or messagingServiceSid)" });
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const send = (to, messageBody) => client.messages.create({
    to,
    body: messageBody,
    ...(TWILIO_MESSAGING_SERVICE_SID
      ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
      : { from: TWILIO_FROM }),
    ...(TWILIO_STATUS_CALLBACK_URL ? { statusCallback: TWILIO_STATUS_CALLBACK_URL } : {})
  });

  try {
    // 1) Text the customer
    const firstName = (String(name).trim().split(/\s+/)[0]) || name;
    const userMsg = await send(
      e164,
      `Fixlo: Thanks ${firstName}! We received your request for ${service}${city ? ` in ${city}` : ""}. We'll text you updates. Reply STOP to opt out.`
    );
    console.log("Twilio user SID:", userMsg.sid);

    // 2) Notify pros (optional)
    if (PROS_NOTIFY_NUMBERS) {
      const msg = `New Fixlo lead: ${service}${city ? ` in ${city}` : ""} — ${name}, ${e164}${details ? ` • ${details}` : ""}`;
      const pros = PROS_NOTIFY_NUMBERS.split(",").map(s => s.trim()).filter(Boolean);
      if (pros.length) {
        const proResults = await Promise.allSettled(pros.map(n => send(n, msg)));
        console.log("Twilio pros result:", proResults.map(r => r.status).join(","));
      }
    }

    // Success only after Twilio accepts the SMS
    return res.status(201).json({ ok: true, sid: userMsg.sid });
  } catch (err) {
    // Surface Twilio’s error details to speed up fixes (e.g., invalid From, blocked To, etc.)
    const code = err?.code;
    const message = err?.message || "Unknown Twilio error";
    console.error("Twilio send error:", code, message);
    return res.status(500).json({ error: `Failed to send SMS: ${message}`, code });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };
