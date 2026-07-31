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
const { connectDB } = require("./config/database");

dotenv.config();

// Load the automatic repair/enrollment worker explicitly so it runs even when
// Render starts the backend with `node index.js` instead of `npm start`.
require("./services/proFollowUpAutoRepair");

const app = express();
const server = http.createServer(app);

// Trust proxy (Render / Cloud proxy aware: rate-limit & IPs)
app.set("trust proxy", 1);

// ----------------------- Owner Notification Service -----------------------
// Loaded early so it is available throughout the module (e.g. error handlers).
const { notify: ownerNotify } = require("./services/ownerNotificationService");

// ----------------------- Utilities & Middleware -----------------------
const axios = require("axios");
const requestLogger = require("./middleware/logger");
const performanceMonitor = require("./utils/performanceMonitor");
const DatabaseOptimizer = require("./utils/databaseOptimizer");
const securityHeaders = require("./middleware/security");
const sanitizeInput = require("./middleware/sanitization");
const shield = require("./middleware/shield");
const errorHandler = require("./middleware/errorHandler");
const { privacyAuditLogger } = require("./middleware/privacyAudit");
const {
  generalRateLimit,
  authRateLimit,
  adminRateLimit,
} = require("./middleware/rateLimiter");

// ----------------------- Models & Services -----------------------
const Pro = require("./models/Pro");
const JobRequest = require("./models/JobRequest");
const geocodingService = require("./utils/geocoding");
const { routeLead } = require("./services/leadAssignmentService");
const { notifyOwnerForLead } = require("./services/ownerLeadNotificationService");
const { sendHomeownerConfirmation } = require("./utils/smsSender");

// ----------------------- Stripe (lazy) -----------------------
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  // Enforce Live Mode in production
  if (process.env.NODE_ENV === "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
    console.error("❌ SECURITY ERROR: Stripe LIVE secret key required in production");
    throw new Error("Stripe LIVE secret key required in production. Use sk_live_ keys only.");
  }
  
  // Validate test mode in non-production
  if (process.env.NODE_ENV !== "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
    console.error("❌ SECURITY ERROR: Live Stripe key detected in non-production environment");
    throw new Error("Stripe live key detected in non-production environment. Use sk_test_ keys only.");
  }
  
  try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    console.log("✅ Stripe initialized in", process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "TEST MODE" : "LIVE MODE");
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
console.log("✅ Vercel Preview Deployments: ENABLED (*.vercel.app)");

// Helper function to check if origin is allowed
function isOriginAllowed(origin) {
  if (!origin) return true;
  
  // Check exact matches
  if (allowedOrigins.includes(origin)) return true;
  
  // Allow Vercel preview deployments (*.vercel.app)
  // Security: Only allow HTTPS Vercel domains to prevent spoofing
  if (origin.endsWith('.vercel.app')) {
    try {
      const url = new URL(origin);
      // Double-check hostname after parsing to prevent URL manipulation attacks
      // (e.g., https://evil.com?fake=.vercel.app)
      if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) {
        return true;
      }
    } catch (e) {
      return false;
    }
  }
  
  return false;
}

// Early OPTIONS (preflight) passthrough — avoids any redirect/middleware side effects
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();

  const origin = req.headers.origin;
  let allowedOrigin = "https://www.fixloapp.com";
  if (!origin) {
    console.log(`🔍 OPTIONS ${req.path} — no origin, using default`);
  } else if (isOriginAllowed(origin)) {
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
      "POST, OPTIONS, GET, PUT, PATCH, DELETE, HEAD"
    )
    .header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, Expires, Cache-Control, Pragma, x-admin-key, x-csrf-token"
    )
    .header("Access-Control-Allow-Credentials", "true")
    .header("Access-Control-Max-Age", "86400")
    .sendStatus(204);
});

// Normal CORS for non-OPTIONS requests
app.use(
  cors({
    origin(origin, cb) {
      if (isOriginAllowed(origin)) return cb(null, true);
      return cb(new Error(`CORS policy does not allow origin: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
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
      "Expires",
      "Cache-Control",
      "Pragma",
      "x-admin-key",
      "x-csrf-token",
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
app.use("/webhook/meta-leads", express.raw({ type: "application/json" }));
app.use(express.json());

// Cookie parser for country detection caching.
// A signing secret makes cookies tamper-evident (signed cookies cannot be
// forged by an attacker even if they know the cookie name).
const cookieParser = require('cookie-parser');
const { csrfProtection, csrfErrorHandler } = require('./middleware/csrf');
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));

// ----------------------- CSRF Protection -----------------------
// Applies csurf token validation to all state-changing requests
// (POST, PUT, PATCH, DELETE).
//
// IMPORTANT: mounted WITHOUT a path pattern so that req.path inside the
// middleware is always the full request path.  When Express mounts middleware
// with a path or regex it strips the matched portion from req.url, making
// req.path === '/' for all routes and breaking prefix-based exemptions such
// as CSRF_EXEMPT_PREFIXES.  Webhook exclusion and all other path checks are
// handled inside csrfProtection itself.
//
// GET / HEAD / OPTIONS are safe methods and are excluded by csurf itself.
//
// The CSRF token is issued via GET /api/csrf-token (see below).
// See server/middleware/csrf.js for full documentation.
app.use(csrfProtection);
app.use(csrfErrorHandler);

// ----------------------- Static serving (API assets only) -----------------------
app.use(express.static(__dirname)); // e.g., admin assets, images used by API docs, etc.
app.use(express.static(path.join(__dirname, ".."))); // safety (no client build served)

// Privacy Policy static file route
app.use('/privacy-policy', express.static(path.join(__dirname, '../client/public/privacy-policy.html')));

// ----------------------- Socket.IO -----------------------
const io = new Server(server, {
  cors: { 
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy does not allow origin'));
      }
    }, 
    methods: ["GET", "POST"] 
  },
});

// Make io accessible to routes
app.set('io', io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected", socket.id);
  
  // Handle message sending
  socket.on("message:send", (message) => {
    console.log("📤 Message sent via socket:", message._id);
    io.emit("message:new", message);
  });

  // Handle message read status
  socket.on("message:read", (data) => {
    console.log("✅ Message read via socket:", data.messageId);
    io.emit("message:read", data);
  });

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
try {
  app.use(privacyAuditLogger);
  console.log("✅ Privacy audit logger loaded");
} catch (e) {
  console.error("❌ Privacy audit logger failed:", e.message);
}

// ----------------------- Explicit preflights for hot endpoints -----------------------
function preflight(path, methods = "POST, OPTIONS") {
  app.options(path, (req, res) => {
    const origin = req.headers.origin;
    let allowedOrigin = "https://www.fixloapp.com";
    if (origin && isOriginAllowed(origin)) allowedOrigin = origin;
    else if (origin) {
      console.log(`❌ Origin "${origin}" not allowed for ${path}`);
      return res.status(403).json({ error: "CORS policy violation" });
    }
    res
      .header("Access-Control-Allow-Origin", allowedOrigin)
      .header("Access-Control-Allow-Methods", methods)
      .header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin, x-csrf-token"
      )
      .header("Access-Control-Allow-Credentials", "true")
      .header("Access-Control-Max-Age", "86400")
      .sendStatus(204);
  });
}
preflight("/api/pro-signup");
preflight("/api/homeowner-lead");
preflight("/api/requests");
preflight("/api/invite-codes/validate");
preflight("/api/*", "POST, OPTIONS, GET, PUT, DELETE, HEAD");

// ----------------------- CSRF Token Endpoint -----------------------
// IMPORTANT: Must be registered BEFORE any broad app.use("/api", router)
// mounts that carry global requireUser middleware (messages, notifications,
// calendar, documents).  Those routers apply requireUser to every request
// that enters them, which returns 401 for unauthenticated GET /api/csrf-token
// before the endpoint below can respond.
//
// GET /api/csrf-token is a public, unauthenticated endpoint — no login needed.
// It is a GET (safe/idempotent), so csurf does not require a token to access it.
// GET /api/csrf-token → { csrfToken: "..." }
app.get('/api/csrf-token', (req, res) => {
  return res.json({ csrfToken: req.csrfToken() });
});

// ----------------------- Routes -----------------------
// Note: Cloudinary signing route is required for Pro photo uploads
app.use("/api/cloudinary", require("./routes/cloudinary")); // POST /api/cloudinary/sign

app.use("/api/admin", adminRateLimit, require("./routes/admin"));
app.use("/api/admin", adminRateLimit, require("./routes/adminJobs")); // Admin job management
app.use("/api/admin", adminRateLimit, require("./routes/adminDashboard")); // Admin dashboard control center
// Meta Leads automation: mounted here (before messages/notifications/calendar/documents)
// so that the admin JWT — which has no `id` field and therefore fails the requireUser
// check in those routers — never reaches those middleware handlers.
app.use(require("./routes/metaLeadAutomation"));

// Admin: Grant lifetime membership (protected by x-admin-key header)
app.post("/api/admin/grant-lifetime", adminRateLimit, async (req, res) => {
  if (!process.env.ADMIN_SECRET_KEY || req.headers["x-admin-key"] !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { proId } = req.body || {};
  if (!proId) return res.status(400).json({ error: "proId is required" });
  if (!mongoose.Types.ObjectId.isValid(proId)) {
    return res.status(400).json({ error: "Invalid proId format" });
  }
  try {
    const pro = await Pro.findById(proId);
    if (!pro) return res.status(404).json({ error: "Pro not found" });
    pro.subscriptionType = "lifetime";
    pro.subscriptionStatus = "active";
    pro.subscriptionEndDate = null;
    await pro.save();
    res.json({ success: true, pro });
  } catch (err) {
    console.error("Grant lifetime failed", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Generate invite code
app.post("/api/admin/invite-codes", adminRateLimit, async (req, res) => {
  if (!process.env.ADMIN_SECRET_KEY || req.headers["x-admin-key"] !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const InviteCode = require("./models/InviteCode");
    const { generateCode } = require("./utils/inviteCodeGenerator");
    const code = await generateCode(req.body || {});
    const record = await InviteCode.findOne({ code });
    res.status(201).json({ success: true, inviteCode: record });
  } catch (err) {
    console.error("Generate invite code failed", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Validate invite code
app.post("/api/invite-codes/validate", async (req, res) => {
  try {
    const InviteCode = require("./models/InviteCode");
    const code = String(req.body?.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ valid: false, error: "Code is required" });
    const record = await InviteCode.findOne({ code });
    if (!record) return res.status(404).json({ valid: false, error: "Invalid code" });
    if (record.used) return res.status(409).json({ valid: false, error: "Code already used" });
    if (record.expiresAt && record.expiresAt < new Date()) {
      return res.status(410).json({ valid: false, error: "Code expired" });
    }
    res.json({ valid: true, inviteCode: record });
  } catch (err) {
    console.error("Validate invite code failed", err);
    res.status(500).json({ valid: false, error: err.message });
  }
});

// ----------------------- Additional routes -----------------------
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/homeowner"));
app.use("/api", require("./routes/pro"));
app.use("/api", require("./routes/requests"));
app.use("/api", require("./routes/serviceRequest"));
app.use("/api", require("./routes/subscribe"));
app.use("/api", require("./routes/messages"));
app.use("/api", require("./routes/notifications"));
app.use("/api", require("./routes/calendar"));
app.use("/api", require("./routes/documents"));
app.use("/api", require("./routes/public"));

// ----------------------- Health -----------------------
app.get("/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV, mongo: mongoose.connection.readyState });
});

// ----------------------- Start -----------------------
async function start() {
  try {
    await connectDB();
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`🚀 Fixlo API listening on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Startup failed", err);
    process.exit(1);
  }
}

start();

module.exports = { app, server };
