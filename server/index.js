// Fixlo Backend API — v2.4.0 (API-ONLY MODE, no frontend serving)
// Last updated: 2025-08-20

// ----------------------- Core & Setup -----------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Trust proxy (Render / Cloud proxy aware: rate-limit & IPs)
app.set("trust proxy", 1);

// ----------------------- Utilities & Middleware -----------------------
const axios = require("axios");
const requestLogger = require("./middleware/logger");
const performanceMonitor = require("./utils/performanceMonitor");
const DatabaseOptimizer = require("./utils/databaseOptimizer");
const securityHeaders = require("./middleware/security");
const sanitizeInput = require("./middleware/sanitization");
const shield = require("./middleware/shield");
const errorHandler = require("./middleware/errorHandler");
const {
  generalRateLimit,
  authRateLimit,
  adminRateLimit,
} = require("./middleware/rateLimiter");

// ----------------------- Models & Services -----------------------
const Pro = require("./models/Pro");
const geocodingService = require("./utils/geocoding");

// ----------------------- Stripe (lazy) -----------------------
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.warn("⚠️ Stripe not initialized:", e?.message || e);
  }
} else {
  console.warn("⚠️ STRIPE_SECRET_KEY not found — Stripe features disabled");
}

// ----------------------- CORS -----------------------
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process
      .env
      .CORS_ALLOWED_ORIGINS
      .split(",")
      .map((o) => o.trim())
  : [
      "https://www.fixloapp.com",
      "https://fixloapp.com",
      "http://localhost:3000",
      "http://localhost:8000",
    ];

console.log("🔍 CORS Configuration");
console.log("📋 Allowed Origins:", allowedOrigins);
console.log(
  "🌐 Env CORS_ALLOWED_ORIGINS:",
  process.env.CORS_ALLOWED_ORIGINS || "not set (using defaults)"
);

// Early OPTIONS (preflight) passthrough — avoids any redirect/middleware side effects
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();

  const origin = req.headers.origin;
  let allowedOrigin = "https://www.fixloapp.com";
  if (!origin) {
    console.log(`🔍 OPTIONS ${req.path} — no origin, using default`);
  } else if (allowedOrigins.includes(origin)) {
    allowedOrigin = origin;
    console.log(`🔍 OPTIONS ${req.path} — origin allowed: ${origin}`);
  } else {
    console.log(`❌ OPTIONS ${req.path} — origin not allowed: ${origin}`);
    return res.status(403).json({ error: "CORS policy violation" });
  }

  res
    .header("Access-Control-Allow-Origin", allowedOrigin)
    .header(
      "Access-Control-Allow-Methods",
      "POST, OPTIONS, GET, PUT, DELETE, HEAD"
    )
    .header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    )
    .header("Access-Control-Allow-Credentials", "true")
    .header("Access-Control-Max-Age", "86400")
    .sendStatus(204);
});

// Normal CORS for non-OPTIONS requests
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS policy does not allow origin: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Accept",
      "Accept-Language",
      "Content-Language",
      "Content-Type",
      "Origin",
      "Authorization",
      "X-Requested-With",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
  })
);

// ----------------------- Body Parsers -----------------------
// Raw body for Stripe webhooks must be before express.json
app.use("/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json());

// ----------------------- Static serving (API assets only) -----------------------
app.use(express.static(__dirname)); // e.g., admin assets, images used by API docs, etc.
app.use(express.static(path.join(__dirname, ".."))); // safety (no client build served)

// ----------------------- Socket.IO -----------------------
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});
io.on("connection", (socket) => {
  console.log("🔌 Socket connected", socket.id);
  socket.on("disconnect", () => console.log("🔌 Socket disconnected", socket.id));
});

// ----------------------- Diagnostics -----------------------
console.log(`🌍 NODE_ENV = ${process.env.NODE_ENV}`);
console.log(`🛰️ API-ONLY MODE — Frontend is served by Vercel (https://fixloapp.com)`);

// Request logging
try {
  app.use(requestLogger);
  console.log("✅ Request logger loaded");
} catch (e) {
  console.error("❌ Logger failed:", e.message);
}

// Perf monitor
try {
  app.use(performanceMonitor.middleware());
  console.log("✅ Performance monitor loaded");
} catch (e) {
  console.error("❌ Perf monitor failed:", e.message);
}

// Normalize paths & log API requests
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(
      `🔍 API ${req.method} ${req.path} (origin: ${req.headers.origin || "n/a"})`
    );
    if (req.path.endsWith("/") && req.path !== "/api/") {
      console.log(`⚠️ Trailing slash potential issue: ${req.path}`);
    }
  }
  next();
});

// Security, sanitization, shield, rate limiting
try {
  app.use(securityHeaders);
  console.log("✅ Security headers loaded");
} catch (e) {
  console.error("❌ Security headers failed:", e.message);
}
try {
  app.use(sanitizeInput);
  console.log("✅ Sanitization loaded");
} catch (e) {
  console.error("❌ Sanitization failed:", e.message);
}
try {
  app.use(shield);
  console.log("✅ Shield loaded");
} catch (e) {
  console.error("❌ Shield failed:", e.message);
}
try {
  app.use(generalRateLimit);
  console.log("✅ Rate limiter loaded");
} catch (e) {
  console.error("❌ Rate limiter failed:", e.message);
}

// ----------------------- Explicit preflights for hot endpoints -----------------------
function preflight(path, methods = "POST, OPTIONS") {
  app.options(path, (req, res) => {
    const origin = req.headers.origin;
    let allowedOrigin = "https://www.fixloapp.com";
    if (origin && allowedOrigins.includes(origin)) allowedOrigin = origin;
    else if (origin) {
      console.log(`❌ Origin "${origin}" not allowed for ${path}`);
      return res.status(403).json({ error: "CORS policy violation" });
    }
    res
      .header("Access-Control-Allow-Origin", allowedOrigin)
      .header("Access-Control-Allow-Methods", methods)
      .header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin"
      )
      .header("Access-Control-Allow-Credentials", "true")
      .header("Access-Control-Max-Age", "86400")
      .sendStatus(204);
  });
}
preflight("/api/pro-signup");
preflight("/api/homeowner-lead");
preflight("/api/*", "POST, OPTIONS, GET, PUT, DELETE, HEAD");

// ----------------------- Routes -----------------------
// Note: Cloudinary signing route is required for Pro photo uploads
app.use("/api/cloudinary", require("./routes/cloudinary")); // POST /api/cloudinary/sign

app.use("/api/admin", adminRateLimit, require("./routes/admin"));
app.use("/api/auth", authRateLimit, require("./routes/auth"));
app.use("/api/pro-auth", authRateLimit, require("./routes/proAuth"));

app.use("/api/pros", generalRateLimit, require("./routes/proRoutes")); // auth & mgmt

app.use("/api/pro", generalRateLimit, require("./routes/proJobs")); // professional jobs

app.use("/api/pro/jobs", generalRateLimit, require("./routes/proJobs")); // professional job management
app.use("/api/homeowner-lead", require("./routes/homeownerLead"));
app.use("/api/leads", require("./routes/leads")); // Lead management with database storage
app.use("/api/requests", require("./routes/requests")); // Homeowner service requests
app.use("/api/service-request", require("./routes/serviceRequest"));
app.use("/api/notify", require("./routes/notify"));

app.use("/api/stripe", require("./routes/stripe")); // subscription helpers
app.use("/api/subscribe", require("./routes/subscribe")); // legacy subscribe
app.use("/api", require("./routes/subscribe")); // exposes POST /api/subscribe/checkout

app.use("/api/upload", require("./routes/upload")); // direct uploads (legacy)
app.use("/api/reviews", require("./routes/reviews")); // reviews API (public)
app.use("/api", require("./routes/reviewCapture")); // capture via magic links

app.use("/api", require("./routes/ipinfo")); // IP info proxy
app.use("/api/ai", require("./routes/ai")); // AI assistant
app.use("/api/contact", require("./routes/contact")); // contact form
app.use("/api/referrals", require("./routes/referrals")); // referral rewards

// Share Profiles & Boost system
app.use("/api", require("./routes/profiles")); // slug lookup
app.use("/api", require("./routes/share")); // share events/boost logic
app.use("/api", require("./routes/search")); // boosted search

// ----------------------- Stripe: Simple Subscribe endpoint (kept for PricingPage.jsx) -----------------------
app.post("/api/subscribe", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        error: "Payment system not configured",
        message: "Stripe is not initialized on the server",
      });
    }

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email is required" });

    const clientUrl = process.env.CLIENT_URL || "https://www.fixloapp.com";

    const priceId =
      process.env.STRIPE_FIRST_MONTH_PRICE_ID ||
      process.env.STRIPE_MONTHLY_PRICE_ID ||
      process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({
        error: "Payment configuration error",
        message: "No Stripe price ID configured",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      customer_email: email,
      success_url: `${clientUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-cancel.html`,
      metadata: {
        service: "fixlo-pro-subscription",
        email,
        timestamp: new Date().toISOString(),
      },
    });

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("❌ Stripe subscribe error:", err.message);
    return res
      .status(500)
      .json({ error: "Payment processing error", message: err.message });
  }
});

// ----------------------- Pro Signup (with age check & dupe guard) -----------------------
app.post("/api/pro-signup", async (req, res) => {
  try {
    const { ENABLE_BG_CHECKS } = require('./config/flags');
    const { name, email, phone, trade, location, dob, role, termsConsent, smsConsent } =
      req.body || {};

    if (!name || !email || !phone || !trade || !location || !dob) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, trade, location, and date of birth are required",
      });
    }

    const birthDate = new Date(dob);
    const age = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be 18 or older to join Fixlo as a professional",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message:
          "Professional signup is temporarily unavailable. Please try again later.",
      });
    }

    const tradeNormalized = String(trade).trim().toLowerCase();

    // disallow duplicates by email+trade
    const existingSameTrade = await Pro.findOne({
      email: email.toLowerCase(),
      trade: tradeNormalized,
    });
    if (existingSameTrade) {
      return res.status(409).json({
        success: false,
        message: `You are already registered for ${trade}.`,
      });
    }

    // Background check decision based on feature flag
    let verificationStatus = 'pending';
    let verificationNotes = '';

    if (!ENABLE_BG_CHECKS) {
      verificationStatus = 'skipped';
      verificationNotes = 'Background checks temporarily disabled by config.';
    } else {
      // existing Checkr invitation / flow would go here when implemented
    }

    // Allow same email registering for a different trade, but require explicit consent flags
    const pro = await Pro.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone.trim(),
      trade: tradeNormalized,
      location: String(location).trim(),
      role: role || "pro",
      wantsNotifications: true,
      verificationStatus,
      verificationNotes,
      smsConsent: {
        given: Boolean(smsConsent?.given),
        dateGiven: smsConsent?.dateGiven || new Date(),
        ipAddress: smsConsent?.ipAddress || "",
        userAgent: smsConsent?.userAgent || "",
        consentText:
          smsConsent?.consentText ||
          "I expressly consent to receive automated SMS text messages from Fixlo. Reply STOP to unsubscribe, HELP for help.",
      },
      termsConsent: {
        given: Boolean(termsConsent?.given),
        dateGiven: termsConsent?.dateGiven || new Date(),
        ipAddress: termsConsent?.ipAddress || "",
        userAgent: termsConsent?.userAgent || "",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({ success: true, proId: pro._id, verificationStatus });
  } catch (err) {
    console.error("❌ Pro signup error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
});

// ----------------------- Missing fallback route: /api/signup/pro -----------------------
// Frontend expects this as fallback #3, forward to existing pro-signup logic
app.post("/api/signup/pro", async (req, res) => {
  try {
    const { ENABLE_BG_CHECKS } = require('./config/flags');
    const { name, email, phone, trade, location, dob, role, termsConsent, smsConsent } =
      req.body || {};

    if (!name || !email || !phone || !trade || !location || !dob) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, trade, location, and date of birth are required",
      });
    }

    const birthDate = new Date(dob);
    const age = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be 18 or older to join Fixlo as a professional",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message:
          "Professional signup is temporarily unavailable. Please try again later.",
      });
    }

    const tradeNormalized = String(trade).trim().toLowerCase();

    // disallow duplicates by email+trade
    const existingSameTrade = await Pro.findOne({
      email: email.toLowerCase(),
      trade: tradeNormalized,
    });
    if (existingSameTrade) {
      return res.status(409).json({
        success: false,
        message: `You are already registered for ${trade}.`,
      });
    }

    // Background check decision based on feature flag
    let verificationStatus = 'pending';
    let verificationNotes = '';

    if (!ENABLE_BG_CHECKS) {
      verificationStatus = 'skipped';
      verificationNotes = 'Background checks temporarily disabled by config.';
    } else {
      // existing Checkr invitation / flow would go here when implemented
    }

    // Allow same email registering for a different trade, but require explicit consent flags
    const pro = await Pro.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone.trim(),
      trade: tradeNormalized,
      location: String(location).trim(),
      role: role || "pro",
      wantsNotifications: true,
      verificationStatus,
      verificationNotes,
      smsConsent: {
        given: Boolean(smsConsent?.given),
        dateGiven: smsConsent?.dateGiven || new Date(),
        ipAddress: smsConsent?.ipAddress || "",
        userAgent: smsConsent?.userAgent || "",
        consentText:
          smsConsent?.consentText ||
          "I expressly consent to receive automated SMS text messages from Fixlo. Reply STOP to unsubscribe, HELP for help.",
      },
      termsConsent: {
        given: Boolean(termsConsent?.given),
        dateGiven: termsConsent?.dateGiven || new Date(),
        ipAddress: termsConsent?.ipAddress || "",
        userAgent: termsConsent?.userAgent || "",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({ success: true, proId: pro._id, verificationStatus });
  } catch (err) {
    console.error("❌ Pro signup error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
});

// ----------------------- Health & Meta -----------------------
app.get("/api/health", async (req, res) => {
  const db =
    mongoose.connection.readyState === 1
      ? "up"
      : String(mongoose.connection.readyState);
  return res.json({
    status: "ok",
    db,
    time: new Date().toISOString(),
    apiOnly: true,
  });
});

app.get("/api/version", (req, res) => {
  return res.json({
    name: "fixlo-backend",
    mode: "api-only",
    version: "2.4.0",
    time: new Date().toISOString(),
  });
});

// ----------------------- Stripe Webhook -----------------------
app.post("/webhook/stripe", async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send("Stripe webhook not configured");
  }
  const sig = req.headers["stripe-signature"];
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle subscription events here (optional)
    console.log("💳 Stripe webhook event:", event.type);

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ----------------------- Checkr Webhook (no-op when background checks disabled) -----------------------
app.post('/webhook/checkr', (req, res) => {
  const { ENABLE_BG_CHECKS } = require('./config/flags');
  if (!ENABLE_BG_CHECKS) return res.status(204).end(); // ignore quietly
  // ... existing webhook logic would go here when background checks are enabled
  console.log("📋 Checkr webhook received but background checks are disabled");
  res.status(204).end();
});

// ----------------------- Global Error Handler -----------------------
app.use(errorHandler);

// ----------------------- DB Connect & Server Start -----------------------
async function start() {
  const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fixloapp";
  const PORT = process.env.PORT || 10000;

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(MONGO_URI, { maxPoolSize: 10 });
    console.log("✅ MongoDB connected");

    // (Optional) Index optimization/cleanup
    try {
      await DatabaseOptimizer.ensureIndexes?.();
      console.log("✅ DB indexes ensured");
    } catch (e) {
      console.warn("⚠️ DB optimizer skipped:", e?.message || e);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Fixlo API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    console.warn("⚠️ Starting server without database connection");
    
    // Start server even without database
    server.listen(PORT, () => {
      console.log(`🚀 Fixlo API listening on port ${PORT} (DB-less mode)`);
    });
  }
}

start();
