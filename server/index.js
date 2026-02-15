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
const { privacyAuditLogger } = require("./middleware/privacyAudit");
const { sanitizeMongoURI, parseMongoURI, removeMongoDBName } = require("./lib/mongoUtils");
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
      "POST, OPTIONS, GET, PUT, DELETE, HEAD"
    )
    .header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, Expires, Cache-Control, Pragma"
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
      "Expires",
      "Cache-Control",
      "Pragma",
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

// Cookie parser for country detection caching
const cookieParser = require('cookie-parser');
app.use(cookieParser());

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
        "Content-Type, Authorization, X-Requested-With, Accept, Origin"
      )
      .header("Access-Control-Allow-Credentials", "true")
      .header("Access-Control-Max-Age", "86400")
      .sendStatus(204);
  });
}
preflight("/api/pro-signup");
preflight("/api/homeowner-lead");
preflight("/api/requests");
preflight("/api/*", "POST, OPTIONS, GET, PUT, DELETE, HEAD");

// ----------------------- Routes -----------------------
// Note: Cloudinary signing route is required for Pro photo uploads
app.use("/api/cloudinary", require("./routes/cloudinary")); // POST /api/cloudinary/sign

app.use("/api/admin", adminRateLimit, require("./routes/admin"));
app.use("/api/admin", adminRateLimit, require("./routes/adminJobs")); // Admin job management

// AI Automation Routes
app.use("/api/lead-hunter", generalRateLimit, require("./routes/leadHunter")); // AI Lead Hunter
app.use("/api/seo-ai", generalRateLimit, require("./routes/seoAI")); // SEO AI Engine

app.use("/api/auth", authRateLimit, require("./routes/auth"));
app.use("/api/pro-auth", authRateLimit, require("./routes/proAuth"));

// Social Media Manager (admin only - protected with requireAuth in routes)
try {
  const socialManagerRoutes = require("./modules/social-manager/routes");
  app.use("/api/social", adminRateLimit, socialManagerRoutes);
  console.log("✅ Social Media Manager routes loaded (admin protected)");
} catch (e) {
  console.warn("⚠️ Social Media Manager routes not loaded:", e.message);
}

app.use("/api/subscription", generalRateLimit, require("./routes/subscription")); // Subscription pause/resume

app.use("/api/pros", generalRateLimit, require("./routes/proRoutes")); // auth & mgmt

app.use("/api/pro", generalRateLimit, require("./routes/proJobs")); // professional jobs

app.use("/api/pro/jobs", generalRateLimit, require("./routes/proJobs")); // professional job management
app.use("/api/contractor", generalRateLimit, require("./routes/contractor")); // contractor workflow
app.use("/api/customer", generalRateLimit, require("./routes/customerPortal")); // customer portal
app.use("/api/homeowner-lead", require("./routes/homeownerLead"));
app.use("/api/leads", require("./routes/leads")); // Lead management with database storage

app.use("/api/requests", require("./routes/requests")); // Homeowner service requests
app.use("/api/service-request", require("./routes/serviceRequest"));
app.use("/api/service-intake", require("./routes/serviceIntake")); // Charlotte service intake flow
app.use("/api/notify", require("./routes/notify"));

app.use("/api/stripe", require("./routes/stripe")); // subscription helpers
app.use("/api/subscribe", require("./routes/subscribe")); // legacy subscribe
app.use("/api", require("./routes/subscribe")); // exposes POST /api/subscribe/checkout

app.use("/api/upload", require("./routes/upload")); // direct uploads (legacy)
app.use("/api/reviews", require("./routes/reviews")); // reviews API (public)
app.use("/api", require("./routes/reviewCapture")); // capture via magic links

app.use("/api", require("./routes/ipinfo")); // IP info proxy
app.use("/api/country", require("./routes/country")); // Country detection for global expansion
app.use("/api/pricing", require("./routes/pricing")); // International pricing engine
app.use("/api/pricing-status", require("./routes/pricingStatus")); // Early access pricing status
app.use("/api/compliance", require("./routes/compliance")); // Legal & tax compliance
app.use("/api/ai", require("./routes/ai")); // AI assistant
app.use("/api/contact", require("./routes/contact")); // contact form
app.use("/api/referrals", require("./routes/referrals")); // referral rewards (Pro-to-Pro)
app.use("/api/commission-referrals", generalRateLimit, require("./routes/commissionReferrals")); // public commission referrals
app.use("/api/payouts", generalRateLimit, require("./routes/payouts")); // commission payouts
app.use("/api/distribution", adminRateLimit, require("./routes/distribution")); // distribution engine (admin only)

// Direct messaging
app.use("/api", generalRateLimit, require("./routes/messages")); // messaging API

// Background check integration (Checkr)
app.use("/api/checkr", require("./routes/checkrRoutes")); // Checkr candidate creation & webhooks

// Privacy & Data Rights (GDPR/CCPA compliance)
app.use("/api/privacy", require("./routes/privacy")); // data access, export, deletion

// Share Profiles & Boost system
app.use("/api", require("./routes/profiles")); // slug lookup
app.use("/api", require("./routes/share")); // share events/boost logic
app.use("/api", require("./routes/search")); // boosted search

// SEO Domination Agent (admin only)
app.use("/api/seo-agent", adminRateLimit, require("./routes/seoAgent")); // autonomous SEO agent

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
    const { isCheckrEnabled, createCandidateAndInvitation, parseFullName, formatDobForCheckr } = require('./utils/checkr');
    const { name, email, phone, trade, location, dob, role, termsConsent, smsConsent, ssn, zipcode } =
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
    let checkrData = null;

    if (!ENABLE_BG_CHECKS) {
      verificationStatus = 'skipped';
      verificationNotes = 'Background checks temporarily disabled by config.';
    } else if (isCheckrEnabled() && ssn && zipcode) {
      // Initiate Checkr background check if credentials and data provided
      try {
        console.log('🔍 Initiating Checkr background check for new Pro');
        
        // Parse name into first and last name
        const { firstName, lastName } = parseFullName(name);
        
        // Format DOB for Checkr (YYYY-MM-DD)
        const dobFormatted = formatDobForCheckr(dob);
        
        checkrData = await createCandidateAndInvitation({
          email: email.toLowerCase(),
          phone: phone.trim(),
          firstName,
          lastName,
          dob: dobFormatted,
          ssn,
          zipcode
        });
        
        console.log(`✅ Checkr invitation created: ${checkrData.invitationId}`);
        verificationNotes = 'Background check invitation sent via Checkr';
      } catch (checkrError) {
        console.error('❌ Checkr integration error:', checkrError.message);
        // Don't fail signup if Checkr fails - log and continue
        verificationNotes = `Background check failed to initiate: ${checkrError.message}`;
      }
    } else if (isCheckrEnabled()) {
      verificationNotes = 'Background check requires SSN and ZIP code - awaiting additional info';
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
      // Add Checkr IDs if available
      ...(checkrData && {
        checkrCandidateId: checkrData.candidateId,
        checkrInvitationId: checkrData.invitationId,
        backgroundCheckStatus: 'pending',
      }),
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

    const response = {
      success: true,
      proId: pro._id,
      verificationStatus,
    };
    
    // Include Checkr invitation URL if available
    if (checkrData?.invitationUrl) {
      response.backgroundCheckUrl = checkrData.invitationUrl;
    }

    return res.status(201).json(response);
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
    const { isCheckrEnabled, createCandidateAndInvitation, parseFullName, formatDobForCheckr } = require('./utils/checkr');
    const { name, email, phone, trade, location, dob, role, termsConsent, smsConsent, ssn, zipcode } =
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
    let checkrData = null;

    if (!ENABLE_BG_CHECKS) {
      verificationStatus = 'skipped';
      verificationNotes = 'Background checks temporarily disabled by config.';
    } else if (isCheckrEnabled() && ssn && zipcode) {
      // Initiate Checkr background check if credentials and data provided
      try {
        console.log('🔍 Initiating Checkr background check for new Pro');
        
        // Parse name into first and last name
        const { firstName, lastName } = parseFullName(name);
        
        // Format DOB for Checkr (YYYY-MM-DD)
        const dobFormatted = formatDobForCheckr(dob);
        
        checkrData = await createCandidateAndInvitation({
          email: email.toLowerCase(),
          phone: phone.trim(),
          firstName,
          lastName,
          dob: dobFormatted,
          ssn,
          zipcode
        });
        
        console.log(`✅ Checkr invitation created: ${checkrData.invitationId}`);
        verificationNotes = 'Background check invitation sent via Checkr';
      } catch (checkrError) {
        console.error('❌ Checkr integration error:', checkrError.message);
        // Don't fail signup if Checkr fails - log and continue
        verificationNotes = `Background check failed to initiate: ${checkrError.message}`;
      }
    } else if (isCheckrEnabled()) {
      verificationNotes = 'Background check requires SSN and ZIP code - awaiting additional info';
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
      // Add Checkr IDs if available
      ...(checkrData && {
        checkrCandidateId: checkrData.candidateId,
        checkrInvitationId: checkrData.invitationId,
        backgroundCheckStatus: 'pending',
      }),
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

    const response = {
      success: true,
      proId: pro._id,
      verificationStatus,
    };
    
    // Include Checkr invitation URL if available
    if (checkrData?.invitationUrl) {
      response.backgroundCheckUrl = checkrData.invitationUrl;
    }

    return res.status(201).json(response);
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

// SMS health check endpoint
app.get('/health/sms', (req, res) => {
  const ok = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE);
  console.log('🏥 SMS Health Check:', {
    hasSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhone: !!process.env.TWILIO_PHONE,
    phone: process.env.TWILIO_PHONE || 'not set',
    radiusMiles: process.env.MATCH_RADIUS_MI || '30 (default)'
  });
  
  res.status(ok ? 200 : 503).json({
    ok,
    hasSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhone: !!process.env.TWILIO_PHONE
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

// CORS configuration test endpoint
// Note: This is a diagnostic endpoint that shows CORS configuration.
// Requests without an Origin header (e.g., direct browser navigation, curl)
// are allowed because they don't trigger CORS checks anyway.
app.get("/api/cors-test", (req, res) => {
  const origin = req.headers.origin;
  // Requests without origin don't need CORS validation (e.g., direct navigation, server-to-server)
  const isAllowed = origin ? isOriginAllowed(origin) : true;
  const originInfo = origin || 'no-origin-header';
  
  return res.json({
    message: "Fixlo CORS is working!",
    origin: originInfo,
    allowed: isAllowed,
    note: !origin ? 'Requests without Origin header do not require CORS validation' : undefined,
    allowedOrigins: allowedOrigins,
    supportsVercelPreviews: true,
    corsVersion: "v2.0-vercel-preview-support",
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
  const PORT = process.env.PORT || 10000;

  // ============================================================================
  // MONGODB CONNECTION - USING ONLY MONGO_URI
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("🔍 MONGODB CONNECTION DEBUG");
  console.log("=".repeat(80));
  console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`📍 Mongoose Version: ${mongoose.version}`);
  
  // Explicit logging before connection
  console.log(`Using Mongo URI: ${process.env.MONGO_URI ? "MONGO_URI" : "NOT FOUND"}`);
  
  // Fatal error if MONGO_URI does not exist
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing.");
    console.error("❌ FATAL ERROR: Cannot start server without MONGO_URI environment variable.");
    console.error("📋 Set MONGO_URI in your environment variables.");
    console.log("=".repeat(80) + "\n");
    process.exit(1);
  }
  
  // Use ONLY MONGO_URI - no fallbacks, no defaults
  const MONGO_URI = process.env.MONGO_URI.trim();
  
  // Sanitize URI for logging (mask password)
  const sanitizedURI = sanitizeMongoURI(MONGO_URI);
  console.log(`📍 Sanitized URI: ${sanitizedURI}`);
  
  // Parse connection components
  const parsed = parseMongoURI(MONGO_URI);
  if (parsed.error) {
    console.error(`❌ URI parsing error: ${parsed.error}`);
  } else {
    console.log(`📍 Parsed Username: ${parsed.username}`);
    console.log(`📍 Parsed Host: ${parsed.host}`);
    console.log(`📍 Parsed Database: ${parsed.database}`);
  }
  
  // Validate URI format
  if (!MONGO_URI.startsWith('mongodb://') && !MONGO_URI.startsWith('mongodb+srv://')) {
    console.error('❌ MALFORMED URI: Must start with mongodb:// or mongodb+srv://');
    console.error('📋 Expected format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    console.error('❌ FATAL ERROR: Invalid MongoDB URI format.');
    console.log("=".repeat(80) + "\n");
    process.exit(1);
  }
  
  console.log("=".repeat(80) + "\n");
  // ============================================================================

  try {
    mongoose.set("strictQuery", true);
    
    // Add explicit connection options for better diagnostics
    const connectionOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4 // Force IPv4
    };
    
    console.log("Connecting to Mongo...");
    console.log('🔌 Connection options:', JSON.stringify(connectionOptions, null, 2));
    
    await mongoose.connect(MONGO_URI, connectionOptions);
    console.log("✅ MongoDB CONNECTED");
    console.log(`📊 Database: ${MONGO_URI.includes('@') ? MONGO_URI.split('@')[1] : 'local'}`);

    // (Optional) Index optimization/cleanup
    try {
      await DatabaseOptimizer.ensureIndexes?.();
      console.log("✅ DB indexes ensured");
    } catch (e) {
      console.warn("⚠️ DB optimizer skipped:", e?.message || e);
    }

    // Initialize Walter Pro user
    try {
      const { initializeWalterPro } = require('./scripts/initWalterPro');
      await initializeWalterPro();
    } catch (e) {
      console.warn("⚠️ Walter Pro initialization skipped:", e?.message || e);
    }

    // Start scheduled tasks for operational safeguards
    // IMPORTANT: Only start after successful DB connection
    try {
      const { startScheduledTasks } = require('./services/scheduledTasks');
      startScheduledTasks();
      console.log('✅ Scheduled tasks started');
    } catch (e) {
      console.warn("⚠️ Scheduled tasks initialization skipped:", e?.message || e);
    }

    // Initialize Social Media Manager
    // SAFETY: Scheduler will only auto-start if SOCIAL_AUTOMATION_ENABLED=true
    // When false, use POST /api/social/scheduler/start to start manually
    try {
      const socialManager = require('./modules/social-manager');
      // Only start if encryption key is configured
      if (process.env.SOCIAL_ENCRYPTION_KEY) {
        await socialManager.initialize({
          startScheduler: true, // Attempts auto-start (respects SOCIAL_AUTOMATION_ENABLED)
          requireApproval: true // Safe default: require manual approval
        });
        console.log('✅ Social Media Manager initialized');
      } else {
        console.log('ℹ️ Social Media Manager not initialized (SOCIAL_ENCRYPTION_KEY not set)');
      }
    } catch (e) {
      console.warn("⚠️ Social Media Manager initialization skipped:", e?.message || e);
    }

    // Initialize SEO Agent Scheduler
    console.log('Initializing SEO Agent Scheduler...');
    try {
      const { getSEOAgentScheduler } = require('./services/seo/scheduler');
      console.log('SEO Agent module loaded successfully');
      getSEOAgentScheduler().initialize();
    } catch (err) {
      console.error('SEO Agent module failed to load:', err.message);
      console.error('Stack trace:', err.stack);
      console.error('❌ FATAL: SEO Agent Scheduler initialization failed - exiting');
      process.exit(1);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Fixlo API listening on port ${PORT}`);
    });
  } catch (err) {
    // ============================================================================
    // MONGODB CONNECTION ERROR DIAGNOSTICS
    // ============================================================================
    console.log("\n" + "=".repeat(80));
    console.error("❌ MongoDB FAILED:", err.message);
    console.log("=".repeat(80));
    console.error(`📍 Error Name: ${err.name || 'Unknown'}`);
    console.error(`📍 Error Message: ${err.message || 'No message'}`);
    console.error(`📍 Error Code: ${err.code || 'No code'}`);
    
    // Log error reason if available (MongoDB-specific)
    if (err.reason) {
      console.error(`📍 Error Reason: ${JSON.stringify(err.reason, null, 2)}`);
    }
    
    // Log full stack trace
    console.error(`📍 Stack Trace:\n${err.stack || 'No stack trace'}`);
    
    // Check for specific authentication errors
    if (err.message && err.message.includes('Authentication failed')) {
      console.error('\n⚠️ AUTHENTICATION ERROR DETECTED');
      console.error('Possible causes:');
      console.error('  1. Incorrect username or password in MONGODB_URI');
      console.error('  2. User does not have access to the specified database');
      console.error('  3. Authentication mechanism mismatch (SCRAM-SHA-1 vs SCRAM-SHA-256)');
      console.error('  4. IP whitelist not configured in MongoDB Atlas');
      console.error('  5. Password contains special characters that need URL encoding');
    }
    
    // Additional diagnostic for connection timeout
    if (err.message && (err.message.includes('timeout') || err.message.includes('ETIMEDOUT'))) {
      console.error('\n⚠️ CONNECTION TIMEOUT DETECTED');
      console.error('Possible causes:');
      console.error('  1. MongoDB server is unreachable (check network)');
      console.error('  2. IP address not whitelisted in MongoDB Atlas');
      console.error('  3. Firewall blocking connection');
    }
    
    // Additional diagnostic for DNS issues
    if (err.code && (err.code === 'EREFUSED' || err.code === 'ENOTFOUND' || err.message.includes('querySrv'))) {
      console.error('\n⚠️ DNS RESOLUTION ERROR DETECTED');
      console.error('Possible causes:');
      console.error('  1. DNS server cannot resolve MongoDB Atlas hostname');
      console.error('  2. Network connectivity issues');
      console.error('  3. Temporary DNS server failure');
      console.error('  4. Incorrect MongoDB Atlas cluster hostname');
      console.error('  5. Corporate/sandbox DNS restrictions');
      console.error('\n💡 SOLUTIONS:');
      console.error('  - Try using standard connection string (mongodb://) instead of SRV (mongodb+srv://)');
      console.error('  - Verify cluster hostname in MongoDB Atlas dashboard');
      console.error('  - Check network/firewall settings');
      console.error('  - Ensure environment has external DNS access');
    }
    
    // Test connection WITHOUT database name
    console.log("\n" + "-".repeat(80));
    console.log("🧪 ATTEMPTING CONNECTION WITHOUT DATABASE NAME");
    console.log("-".repeat(80));
    try {
      const uriWithoutDb = removeMongoDBName(MONGO_URI);
      const sanitizedTestUri = sanitizeMongoURI(uriWithoutDb);
      console.log(`Trying: ${sanitizedTestUri}`);
      const testConnection = await mongoose.createConnection(uriWithoutDb, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
        family: 4
      }).asPromise();
      console.log('✅ Connection works WITHOUT database name - database access issue');
      await testConnection.close();
    } catch (testErr) {
      console.error(`❌ Connection also fails without database: ${testErr.message}`);
    }
    
    console.log("=".repeat(80) + "\n");
    // ============================================================================
    
    console.error("❌ FATAL: Cannot start server without MongoDB connection");
    console.error("❌ Server startup FAILED");
    process.exit(1);
  }
}

start();
