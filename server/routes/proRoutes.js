// routes/pros.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Stripe = require("stripe");

const Pro = require("../models/Pro");
const Review = require("../models/Review");
const JobRequest = require("../models/JobRequest");
const auth = require("../middleware/auth");
const { geocode } = require("../utils/geocode");

// If your Cloudinary utils export a configured Multer uploader:
const { upload } = require("../utils/cloudinary");

const router = express.Router();

/* ---------------------------------- Utils --------------------------------- */

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/* --------------------------------- /test ---------------------------------- */

router.get("/test", (req, res) => {
  res.json({
    message: "Professional routes are working!",
    timestamp: new Date().toISOString(),
  });
});

/* ------------------------------- Preflight CORS ---------------------------- */
/* If you already have global CORS, you can remove these. They’re harmless. */
router.options(["/register", "/login", "/dashboard"], (req, res) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");
  res.sendStatus(204);
});

/* ------------------------------ Register (POST) ---------------------------- */

router.post("/register", async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      trade, 
      location, 
      dob, 
      smsConsent, 
      whatsappOptIn,
      country 
    } = req.body;

    if (!name || !email || !password || !phone || !trade || !location || !dob) {
      return res.status(400).json({
        error:
          "All fields are required: name, email, password, phone, trade, location, dob",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Registration temporarily unavailable. Please try again later.",
      });
    }

    const existing = await Pro.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Professional with this email or phone already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Geocode the pro's location
    let coordinates = [-74.006, 40.7128]; // Default to NYC
    try {
      const coords = await geocode({ address: location });
      if (coords) {
        coordinates = [coords.lng, coords.lat];
      }
    } catch (geocodeError) {
      console.warn('Geocoding failed for pro location:', geocodeError.message);
    }

    // Detect country from phone or explicit country field
    const { isUSPhoneNumber } = require('../utils/twilio');
    let detectedCountry = country || 'US';
    if (!country) {
      detectedCountry = isUSPhoneNumber(phone) ? 'US' : 'XX'; // XX for unknown non-US
    }

    // COMPLIANCE: WhatsApp opt-in only for non-US countries
    const allowWhatsApp = detectedCountry !== 'US';
    const finalWhatsAppOptIn = allowWhatsApp && (whatsappOptIn === true || whatsappOptIn === 'true');

    const newPro = await Pro.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      phone,
      trade,
      location: {
        address: location,
        coordinates: coordinates,
      },
      dob: new Date(dob),
      paymentStatus: "pending",
      smsConsent: smsConsent === true || smsConsent === 'true' || false,
      whatsappOptIn: finalWhatsAppOptIn,
      country: detectedCountry,
    });

    console.log(`✅ Pro registered: ${newPro.email} (Country: ${detectedCountry}, WhatsApp: ${finalWhatsAppOptIn})`);

    const token = jwt.sign(
      { proId: newPro._id, email: newPro.email },
      requireEnv("JWT_SECRET"),
      { expiresIn: "24h" }
    );

    return res.status(201).json({
      message: "Professional registered successfully",
      token,
      pro: {
        id: newPro._id,
        name: newPro.name,
        email: newPro.email,
        trade: newPro.trade,
        location: newPro.location,
        country: newPro.country,
        whatsappOptIn: newPro.whatsappOptIn,
        smsConsent: newPro.smsConsent,
      },
    });
  } catch (err) {
    console.error("Pro register error:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
});

/* ------------------------------ Login (POST) ------------------------------- */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Login temporarily unavailable. Please try again later.",
      });
    }

    const pro = await Pro.findOne({ email: email.toLowerCase() });
    if (!pro) return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, pro.password);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { proId: pro._id, email: pro.email },
      requireEnv("JWT_SECRET"),
      { expiresIn: "24h" }
    );

    return res.json({
      message: "Login successful",
      token,
      pro: {
        id: pro._id,
        name: pro.name,
        email: pro.email,
        trade: pro.trade,
        location: pro.location,
        profileImage: pro.profileImage,
        rating: pro.rating,
        completedJobs: pro.completedJobs,
        paymentStatus: pro.paymentStatus,
      },
    });
  } catch (err) {
    console.error("Pro login error:", err);
    return res.status(500).json({ error: "Server error during login" });
  }
});

/* ---------------------------- Dashboard (GET) ------------------------------ */

router.get("/dashboard", auth, async (req, res) => {
  try {
    const pro = await Pro.findById(req.proId)
      .populate("reviews")
      .select("-password");
    if (!pro) return res.status(404).json({ error: "Professional not found" });

    return res.json({
      pro: {
        id: pro._id,
        name: pro.name,
        email: pro.email,
        phone: pro.phone,
        trade: pro.trade,
        location: pro.location,
        profileImage: pro.profileImage,
        gallery: pro.gallery,
        rating: pro.rating,
        completedJobs: pro.completedJobs,
        reviews: pro.reviews,
        isActive: pro.isActive,
        paymentStatus: pro.paymentStatus,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ error: "Server error fetching dashboard" });
  }
});

/* ----------------------------- Leads (GET) --------------------------------- */
/* GET /api/pros/leads - Get leads/jobs assigned to the authenticated Pro      */

router.get("/leads", auth, async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, returning empty leads array");
      return res.status(200).json([]);
    }

    // Find all jobs assigned to this Pro
    const leads = await JobRequest.find({ assignedTo: req.proId })
      .sort({ createdAt: -1 })
      .limit(100);

    // Transform to match frontend expectations
    const transformedLeads = leads.map((job) => ({
      _id: job._id,
      id: job._id,
      service: job.trade || 'Service',
      name: job.name || '—',
      phone: job.phone || '',
      email: job.email || '',
      city: job.city || job.address?.split(',').pop()?.trim() || '',
      address: job.address || '',
      description: job.description || '',
      status: job.status || 'pending',
      createdAt: job.createdAt,
      scheduledDate: job.scheduledDate,
    }));

    console.log(`✅ Returned ${transformedLeads.length} leads for Pro ${req.proId}`);
    return res.status(200).json(transformedLeads);
  } catch (err) {
    console.error("Error fetching pro leads:", err);
    // Return empty array on error to prevent frontend issues
    return res.status(200).json([]);
  }
});

/* ----------------------------- Uploads (POST) ------------------------------ */
/* Expects your ../utils/cloudinary to provide a Multer-based `upload`.       */
/* profile: field name 'profileImage'; gallery: field name 'galleryImages'    */

router.post("/upload/profile", auth, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });
    const pro = await Pro.findById(req.proId);
    if (!pro) return res.status(404).json({ error: "Professional not found" });

    // Assuming upload middleware already stored Cloudinary URL at file.path
    pro.profileImage = req.file.path;
    await pro.save();

    return res.json({
      message: "Profile image uploaded successfully",
      profileImage: pro.profileImage,
    });
  } catch (err) {
    console.error("Profile upload error:", err);
    return res.status(500).json({ error: "Server error uploading image" });
  }
});

router.post("/upload/gallery", auth, upload.array("galleryImages", 10), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: "No image files provided" });
    const pro = await Pro.findById(req.proId);
    if (!pro) return res.status(404).json({ error: "Professional not found" });

    const newUrls = req.files.map((f) => f.path);
    pro.gallery = [...(pro.gallery || []), ...newUrls];
    await pro.save();

    return res.json({
      message: "Gallery images uploaded successfully",
      gallery: pro.gallery,
    });
  } catch (err) {
    console.error("Gallery upload error:", err);
    return res.status(500).json({ error: "Server error uploading images" });
  }
});

/* ------------------------------ Reviews (CRUD) ----------------------------- */

router.post("/reviews", async (req, res) => {
  try {
    const { proId, rating, comment, reviewer } = req.body || {};
    if (!proId || !(rating >= 1 && rating <= 5)) {
      return res.status(400).json({ error: "proId and rating (1-5) are required" });
    }

    const pro = await Pro.findById(proId);
    if (!pro) return res.status(404).json({ error: "Professional not found" });

    const review = await Review.create({ pro: proId, rating, comment, reviewer });

    const all = await Review.find({ pro: proId });
    const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
    pro.rating = Math.round(avg * 10) / 10;
    pro.reviews = pro.reviews || [];
    pro.reviews.push(review._id);
    await pro.save();

    return res.status(201).json({
      message: "Review added successfully",
      review,
      newRating: pro.rating,
    });
  } catch (err) {
    console.error("Add review error:", err);
    return res.status(500).json({ error: "Server error adding review" });
  }
});

router.get("/reviews/:proId", async (req, res) => {
  try {
    const { proId } = req.params;
    const reviews = await Review.find({ pro: proId }).sort({ createdAt: -1 }).limit(20);
    return res.json({ reviews });
  } catch (err) {
    console.error("Get reviews error:", err);
    return res.status(500).json({ error: "Server error fetching reviews" });
  }
});

/* -------------------------- Stripe Checkout (POST) ------------------------- */
/* Frontend calls POST /api/pros/checkout with pro details; we create a       */
/* subscription Checkout Session and return { url }.                          */

router.post("/checkout", async (req, res) => {
  try {
    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

    const {
      email,
      priceId, // optional override
      firstName,
      lastName,
      phone,
      trade,
      city,
      role,
      smsConsent,
      profilePhotoUrl,
    } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required for checkout session" });
    }

    const PRICE_ID =
      priceId ||
      process.env.STRIPE_FIRST_MONTH_PRICE_ID ||
      process.env.STRIPE_MONTHLY_PRICE_ID ||
      process.env.STRIPE_PRICE_ID;

    if (!PRICE_ID) {
      return res.status(500).json({ error: "No Stripe price ID configured" });
    }

    const clientUrl = process.env.CLIENT_URL || "https://www.fixloapp.com";

    // Upsert pro with pending payment
    const pro = await Pro.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
        email: email.toLowerCase(),
        phone,
        trade,
        city,
        role: role || "pro",
        profilePhotoUrl,
        smsConsent: !!smsConsent,
        paymentStatus: "pending",
      },
      { upsert: true, new: true }
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      customer_email: email,
      success_url: `${clientUrl}/pro/dashboard?checkout=success`,
      cancel_url: `${clientUrl}/?checkout=cancel`,
      metadata: {
        proId: String(pro._id),
        phone: phone || "",
        trade: trade || "",
        city: city || "",
        smsConsent: String(!!smsConsent),
        source: "pro-checkout",
      },
    });

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Pro checkout error:", err);
    return res.status(500).json({ error: "Checkout creation failed" });
  }
});

/* ---------------------------- Signup (fallbacks) --------------------------- */
/* These endpoints align with your client’s fallbacks:                        */
/* POST /api/pros/signup  and  POST /api/pros                                 */

async function forwardToProSignup(req, res) {
  try {
    const {
      name,
      email,
      phone,
      trade,
      location, // string address
      dob,
      role,
      termsConsent,
      smsConsent,
      city, // optional if not using 'location'
    } = req.body || {};

    if (!name || !email || !phone || !trade) {
      return res.status(400).json({
        success: false,
        message: "name, email, phone, and trade are required",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message:
          "Professional signup is temporarily unavailable. Please try again later.",
      });
    }

    const normalizedEmail = String(email).toLowerCase();
    const tradeNormalized = String(trade).trim().toLowerCase();

    const exists = await Pro.findOne({ email: normalizedEmail, trade: tradeNormalized });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: `You are already registered for ${trade}.`,
      });
    }

    const pro = await Pro.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      trade: tradeNormalized,
      city: city || undefined,
      location: location
        ? { address: String(location).trim() }
        : undefined,
      role: role || "pro",
      wantsNotifications: true,
      smsConsent: !!(smsConsent?.given ?? smsConsent),
      termsConsent: !!(termsConsent?.given ?? termsConsent),
      paymentStatus: "pending",
    });

    return res
      .status(201)
      .json({ success: true, proId: pro._id, verificationStatus: pro.verificationStatus || "pending" });
  } catch (err) {
    console.error("Pro signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

router.post("/signup", forwardToProSignup);
router.post("/", forwardToProSignup);

module.exports = router;
