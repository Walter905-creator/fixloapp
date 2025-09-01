import twilio from "twilio";

async function readBody(req) {
  if (req.body) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8") || "{}";
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async function handler(req, res) {
  const origin = process.env.CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = await readBody(req);
  const { name, phone, service, city, details } = body || {};
  if (!name || !phone) {
    return res.status(400).json({ error: "Missing required fields: name, phone" });
  }

  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_MESSAGING_SERVICE_SID,
    TWILIO_FROM,
    PROS_NOTIFY_NUMBERS
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !(TWILIO_MESSAGING_SERVICE_SID || TWILIO_FROM)) {
    return res.status(500).json({ error: "Twilio env vars missing" });
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const send = (to, body) => client.messages.create({
    to,
    body,
    ...(TWILIO_MESSAGING_SERVICE_SID
      ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
      : { from: TWILIO_FROM }),
  });

  try {
    const who = String(name).split(" ")[0];
    await send(phone, `Fixlo: Thanks ${who || name}! We received your request${service ? ` for ${service}` : ""}${city ? ` in ${city}` : ""}. We'll text you updates. Reply STOP to opt out.`);

    if (PROS_NOTIFY_NUMBERS) {
      const msg = `New Fixlo lead: ${service || "service"}${city ? " in " + city : ""} — ${name}, ${phone}${details ? " • " + details : ""}`;
      const pros = PROS_NOTIFY_NUMBERS.split(",").map(s => s.trim()).filter(Boolean);
      await Promise.all(pros.map(n => send(n, msg)));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Twilio send error:", err?.message || err);
    return res.status(500).json({ error: "Failed to send SMS" });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };
