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
app.set("trust proxy", 1);
const axios = require("axios");
const requestLogger = require("./middleware/logger");
const performanceMonitor = require("./utils/performanceMonitor");
const DatabaseOptimizer = require("./utils/databaseOptimizer");
const securityHeaders = require("./middleware/security");
const sanitizeInput = require("./middleware/sanitization");
const shield = require("./middleware/shield");
const errorHandler = require("./middleware/errorHandler");
const { privacyAuditLogger } = require("./middleware/privacyAudit");
const { generalRateLimit, authRateLimit, adminRateLimit } = require("./middleware/rateLimiter");
const Pro = require("./models/Pro");
const geocodingService = require("./utils/geocoding");
const { sign } = require("./utils/jwt");
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  } catch (e) {}
}
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "https://www.fixloapp.com",
      "https://fixloapp.com",
      "http://localhost:3000",
      "http://localhost:8000",
    ];
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();
  const origin = req.headers.origin;
  let allowedOrigin = "https://www.fixloapp.com";
  if (!origin) {
  } else if (allowedOrigins.includes(origin)) {
    allowedOrigin = origin;
  } else {
    return res.status(403).json({ error: "CORS policy violation" });
  }
  res
    .header("Access-Control-Allow-Origin", allowedOrigin)
    .header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, HEAD")
    .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin")
    .header("Access-Control-Allow-Credentials", "true")
    .header("Access-Control-Max-Age", "86400")
    .sendStatus(204);
});
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
    exposedHeaders: ["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"],
  })
);
app.use("/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "..")));
app.use('/privacy-policy', express.static(path.join(__dirname, '../client/public/privacy-policy.html')));
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});
app.set('io', io);
io.on("connection", (socket) => {
  socket.on("message:send", (message) => {
    io.emit("message:new", message);
  });
  socket.on("message:read", (data) => {
    io.emit("message:read", data);
  });
});
app.use(requestLogger);
app.use(performanceMonitor.middleware());
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    if (req.path.endsWith("/") && req.path !== "/api/") {}
  }
  next();
});
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(shield);
app.use(generalRateLimit);
app.use(privacyAuditLogger);
function preflight(path, methods = "POST, OPTIONS") {
  app.options(path, (req, res) => {
    const origin = req.headers.origin;
    let allowedOrigin = "https://www.fixloapp.com";
    if (origin && allowedOrigins.includes(origin)) allowedOrigin = origin;
    else if (origin) return res.status(403).json({ error: "CORS policy violation" });
    res
      .header("Access-Control-Allow-Origin", allowedOrigin)
      .header("Access-Control-Allow-Methods", methods)
      .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin")
      .header("Access-Control-Allow-Credentials", "true")
      .header("Access-Control-Max-Age", "86400")
      .sendStatus(204);
  });
}
preflight("/api/pro-signup");
preflight("/api/homeowner-lead");
preflight("/api/requests");
preflight("/api/*", "POST, OPTIONS, GET, PUT, DELETE, HEAD");
app.use("/api/cloudinary", require("./routes/cloudinary"));
app.use("/api/admin", adminRateLimit, require("./routes/admin"));
app.use("/api/auth", authRateLimit, require("./routes/auth"));
app.use("/api/pro-auth", authRateLimit, require("./routes/proAuth"));
app.use("/api/pros", generalRateLimit, require("./routes/proRoutes"));
app.use("/api/pro", generalRateLimit, require("./routes/proJobs"));
app.use("/api/pro/jobs", generalRateLimit, require("./routes/proJobs"));
app.use("/api/homeowner-lead", require("./routes/homeownerLead"));
app.use("/api/leads", require("./routes/leads"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/service-request", require("./routes/serviceRequest"));
app.use("/api/notify", require("./routes/notify"));
app.use("/api/stripe", require("./routes/stripe"));
app.use("/api/subscribe", require("./routes/subscribe"));
app.use("/api", require("./routes/subscribe"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api", require("./routes/reviewCapture"));
app.use("/api", require("./routes/ipinfo"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/referrals", require("./routes/referrals"));
app.use("/api", require("./routes/messages"));
app.use("/api/checkr", require("./routes/checkrRoutes"));
app.use("/api/privacy", require("./routes/privacy"));
app.use("/api", require("./routes/profiles"));
app.use("/api", require("./routes/share"));
app.use("/api", require("./routes/search"));
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
    return res
      .status(500)
      .json({ error: "Payment processing error", message: err.message });
  }
});

app.post("/api/pro-signup", async (req, res) => {
  try {
    const { ENABLE_BG_CHECKS } = require('./config/flags');
    const { isCheckrEnabled, createCandidateAndInvitation, parseFullName, formatDobForCheckr } = require('./utils/checkr');
    const { name, email, phone, trade, location, dob, zipcode, smsConsent, termsConsent, ssn } = req.body || {};

    if (!name || !email || !phone || !trade || !location || !dob || !zipcode) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, trade, location, DOB, and ZIP code are required."
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();
    const normalizedTrade = trade.toLowerCase().trim();
    const normalizedLocation = location.toString().trim();
    const normalizedZipcode = zipcode.toString().trim();

    const birthDate = new Date(dob);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be 18 or older to register as a professional."
      });
    }

    const existingSameTrade = await Pro.findOne({
      email: normalizedEmail,
      trade: normalizedTrade,
    });
    if (existingSameTrade) {
      return res.status(409).json({
        success: false,
        message: `You are already registered for ${normalizedTrade}.`
      });
    }

    let verificationStatus = 'skipped';
    let verificationNotes = '';
    let checkrCandidateId = null;
    let checkrInvitationId = null;
    let backgroundCheckUrl = null;
    let checkrData = null;

    if (ENABLE_BG_CHECKS && isCheckrEnabled()) {
      try {
        const { firstName, lastName } = parseFullName(normalizedName);
        const dobFormatted = formatDobForCheckr(dob);
        checkrData = await createCandidateAndInvitation({
          email: normalizedEmail,
          phone: normalizedPhone,
          firstName,
          lastName,
          dob: dobFormatted,
          ssn,
          zipcode: normalizedZipcode
        });
        checkrCandidateId = checkrData.candidateId;
        checkrInvitationId = checkrData.invitationId;
        backgroundCheckUrl = checkrData.invitationUrl;
        verificationStatus = 'pending';
        verificationNotes = 'Background check invitation sent';
      } catch (checkrError) {
        verificationStatus = 'skipped';
        verificationNotes = `Background check failed: ${checkrError.message}`;
      }
    }

    const pro = await Pro.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      trade: normalizedTrade,
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
        address: normalizedLocation
      },
      dob: birthDate,
      zipcode: normalizedZipcode,
      role: "pro",
      wantsNotifications: true,
      verificationStatus,
      verificationNotes,
      ...(checkrCandidateId && { checkrCandidateId }),
      ...(checkrInvitationId && { checkrInvitationId }),
      smsConsent: {
        given: Boolean(smsConsent?.given),
        dateGiven: smsConsent?.dateGiven || new Date(),
        ipAddress: smsConsent?.ipAddress || "",
        userAgent: smsConsent?.userAgent || "",
        consentText: smsConsent?.consentText || "I expressly consent to receive automated SMS text messages from Fixlo. Reply STOP to unsubscribe, HELP for help."
      },
      termsConsent: {
        given: Boolean(termsConsent?.given),
        dateGiven: termsConsent?.dateGiven || new Date(),
        ipAddress: termsConsent?.ipAddress || "",
        userAgent: termsConsent?.userAgent || ""
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = sign({ id: pro._id, role: "pro", email: pro.email });

    const response = {
      success: true,
      proId: pro._id,
      verificationStatus,
      token,
      backgroundCheckUrl: backgroundCheckUrl || null
    };

    return res.status(201).json(response);

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
});
app.post("/api/signup/pro", async (req, res) => {
  try {
    const { ENABLE_BG_CHECKS } = require('./config/flags');
    const { isCheckrEnabled, createCandidateAndInvitation, parseFullName, formatDobForCheckr } = require('./utils/checkr');
    const { name, email, phone, trade, location, dob, zipcode, smsConsent, termsConsent, ssn } = req.body || {};

    if (!name || !email || !phone || !trade || !location || !dob || !zipcode) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, trade, location, DOB, and ZIP code are required."
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();
    const normalizedTrade = trade.toLowerCase().trim();
    const normalizedLocation = location.toString().trim();
    const normalizedZipcode = zipcode.toString().trim();

    const birthDate = new Date(dob);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be 18 or older to register as a professional."
      });
    }

    const existingSameTrade = await Pro.findOne({
      email: normalizedEmail,
      trade: normalizedTrade,
    });
    if (existingSameTrade) {
      return res.status(409).json({
        success: false,
        message: `You are already registered for ${normalizedTrade}.`
      });
    }

    let verificationStatus = 'skipped';
    let verificationNotes = '';
    let checkrCandidateId = null;
    let checkrInvitationId = null;
    let backgroundCheckUrl = null;
    let checkrData = null;

    if (ENABLE_BG_CHECKS && isCheckrEnabled()) {
      try {
        const { firstName, lastName } = parseFullName(normalizedName);
        const dobFormatted = formatDobForCheckr(dob);
        checkrData = await createCandidateAndInvitation({
          email: normalizedEmail,
          phone: normalizedPhone,
          firstName,
          lastName,
          dob: dobFormatted,
          ssn,
          zipcode: normalizedZipcode
        });
        checkrCandidateId = checkrData.candidateId;
        checkrInvitationId = checkrData.invitationId;
        backgroundCheckUrl = checkrData.invitationUrl;
        verificationStatus = 'pending';
        verificationNotes = 'Background check invitation sent';
      } catch (checkrError) {
        verificationStatus = 'skipped';
        verificationNotes = `Background check failed: ${checkrError.message}`;
      }
    }

    const pro = await Pro.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      trade: normalizedTrade,
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
        address: normalizedLocation
      },
      dob: birthDate,
      zipcode: normalizedZipcode,
      role: "pro",
      wantsNotifications: true,
      verificationStatus,
      verificationNotes,
      ...(checkrCandidateId && { checkrCandidateId }),
      ...(checkrInvitationId && { checkrInvitationId }),
      smsConsent: {
        given: Boolean(smsConsent?.given),
        dateGiven: smsConsent?.dateGiven || new Date(),
        ipAddress: smsConsent?.ipAddress || "",
        userAgent: smsConsent?.userAgent || "",
        consentText: smsConsent?.consentText || "I expressly consent to receive automated SMS text messages from Fixlo. Reply STOP to unsubscribe, HELP for help."
      },
      termsConsent: {
        given: Boolean(termsConsent?.given),
        dateGiven: termsConsent?.dateGiven || new Date(),
        ipAddress: termsConsent?.ipAddress || "",
        userAgent: termsConsent?.userAgent || ""
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = sign({ id: pro._id, role: "pro", email: pro.email });

    return res.status(201).json({
      success: true,
      proId: pro._id,
      verificationStatus,
      token,
      backgroundCheckUrl: backgroundCheckUrl || null
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
});
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

app.get('/health/sms', (req, res) => {
  const ok = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE);
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
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.post('/webhook/checkr', (req, res) => {
  const { ENABLE_BG_CHECKS } = require('./config/flags');
  if (!ENABLE_BG_CHECKS) return res.status(204).end();
  res.status(204).end();
});

app.use(errorHandler);

async function start() {
  const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fixloapp";
  const PORT = process.env.PORT || 10000;

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(MONGO_URI, { maxPoolSize: 10 });

    try {
      await DatabaseOptimizer.ensureIndexes?.();
    } catch (e) {}

    server.listen(PORT, () => {
      console.log(`🚀 Fixlo API listening on port ${PORT}`);
    });

  } catch (err) {
    console.warn("⚠️ Starting server without database connection");

    server.listen(PORT, () => {
      console.log(`🚀 Fixlo API listening on port ${PORT} (DB-less mode)`);
    });
  }
}

start();
