// Fixlo Backend API - v2.3.0 - API-ONLY MODE (No frontend serving)
// Last updated: 2025-07-04 - Removed all client/build references
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const axios = require("axios");
const { Server } = require("socket.io");
const { generalRateLimit, authRateLimit, adminRateLimit } = require("./middleware/rateLimiter");
const securityHeaders = require("./middleware/security");
const sanitizeInput = require("./middleware/sanitization");
const shield = require("./middleware/shield");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/logger");
const performanceMonitor = require("./utils/performanceMonitor");
const DatabaseOptimizer = require("./utils/databaseOptimizer");
const path = require("path");

// Import models and services
const Pro = require("./models/Pro");
const geocodingService = require("./utils/geocoding");

dotenv.config();

// Initialize Stripe only if the secret key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not found - Stripe payments will be unavailable');
}

// ✅ Define allowed origins (for production and local dev)
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
    'https://www.fixloapp.com',
    'https://fixloapp.com',
    'http://localhost:3000',
    'http://localhost:8000'
  ];

console.log('🔍 CORS Configuration:');
console.log('📋 Allowed Origins:', allowedOrigins);
console.log('🌐 Environment CORS_ALLOWED_ORIGINS:', process.env.CORS_ALLOWED_ORIGINS || 'not set (using defaults)');

const app = express();
const server = http.createServer(app);

// ✅ Trust proxy setting for rate limiting when deployed behind proxy (Render, etc.)
app.set('trust proxy', 1);

// ✅ EARLY OPTIONS HANDLER - Bypass ALL middleware to prevent redirects
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const requestOrigin = req.headers.origin;
    console.log(`🔍 Early OPTIONS handler: ${req.path} from origin: "${requestOrigin || 'null'}"`);
    
    // Determine allowed origin
    let allowedOrigin;
    if (!requestOrigin) {
      // No origin - use default
      allowedOrigin = 'https://www.fixloapp.com';
      console.log('✅ No origin - using default: https://www.fixloapp.com');
    } else if (allowedOrigins.includes(requestOrigin)) {
      // Origin is allowed - use it
      allowedOrigin = requestOrigin;
      console.log(`✅ Origin "${requestOrigin}" is allowed`);
    } else {
      // Origin not allowed - deny
      console.log(`❌ Origin "${requestOrigin}" is not allowed`);
      console.log(`📋 Allowed origins: ${allowedOrigins.join(', ')}`);
      return res.status(403).json({ error: 'CORS policy violation' });
    }
    
    res
      .header('Access-Control-Allow-Origin', allowedOrigin)
      .header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PUT, DELETE, HEAD')
      .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      .header('Access-Control-Allow-Credentials', 'true')
      .header('Access-Control-Max-Age', '86400')
      .sendStatus(204);
    return;
  }
  next();
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// ✅ Enable CORS for regular requests (after OPTIONS bypass)
app.use(cors({
  origin: function (origin, callback) {
    console.log(`🔍 CORS Origin check: "${origin || 'null'}"`);
    console.log(`📋 Checking against allowed origins: ${JSON.stringify(allowedOrigins)}`);
    
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) {
      console.log('✅ No origin provided - allowing request (server-to-server)');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin "${origin}" is allowed`);
      return callback(null, true);
    } else {
      console.log(`❌ Origin "${origin}" is NOT allowed`);
      console.log(`📋 Allowed origins: ${allowedOrigins.join(', ')}`);
      return callback(new Error(`CORS policy does not allow origin: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Accept',
    'Accept-Language', 
    'Content-Language',
    'Content-Type',
    'Origin',
    'Authorization',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials']
}));

// ✅ Raw body parsing for Stripe webhooks (must come before express.json)
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());

// ✅ Serve static files from server directory (for admin assets like logo)
app.use(express.static(__dirname));

// ✅ Serve static files from root directory (for frontend CSS/JS assets)
app.use(express.static(path.join(__dirname, '..')));

// ✅ EXPLICIT OPTIONS HANDLERS - Before any other routes to prevent redirects
app.options('/api/pro-signup', (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🎯 Explicit OPTIONS /api/pro-signup from origin: "${requestOrigin || 'null'}"`);
  
  // Validate origin
  let allowedOrigin;
  if (!requestOrigin) {
    allowedOrigin = 'https://www.fixloapp.com';
  } else if (allowedOrigins.includes(requestOrigin)) {
    allowedOrigin = requestOrigin;
  } else {
    console.log(`❌ Origin "${requestOrigin}" not allowed for /api/pro-signup`);
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

app.options('/api/homeowner-lead', (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🎯 Explicit OPTIONS /api/homeowner-lead from origin: "${requestOrigin || 'null'}"`);
  
  // Validate origin
  let allowedOrigin;
  if (!requestOrigin) {
    allowedOrigin = 'https://www.fixloapp.com';
  } else if (allowedOrigins.includes(requestOrigin)) {
    allowedOrigin = requestOrigin;
  } else {
    console.log(`❌ Origin "${requestOrigin}" not allowed for /api/homeowner-lead`);
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// ✅ Catch-all OPTIONS handler for any /api/* path
app.options('/api/*', (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🎯 Catch-all OPTIONS ${req.path} from origin: "${requestOrigin || 'null'}"`);
  
  // Validate origin
  let allowedOrigin;
  if (!requestOrigin) {
    allowedOrigin = 'https://www.fixloapp.com';
  } else if (allowedOrigins.includes(requestOrigin)) {
    allowedOrigin = requestOrigin;
  } else {
    console.log(`❌ Origin "${requestOrigin}" not allowed for ${req.path}`);
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PUT, DELETE, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// ✅ Backend is API-only - Frontend served by Vercel
console.log(`🌍 NODE_ENV = ${process.env.NODE_ENV}`);
console.log(`� Fixlo backend running in API-only mode`);
console.log(`📱 Frontend served by Vercel at: https://fixloapp.com`);

// ✅ Request logging
try {
  app.use(requestLogger);
  console.log('✅ Request logger middleware loaded');
} catch (error) {
  console.error('❌ Request logger middleware failed:', error.message);
}

// ✅ Performance monitoring
try {
  app.use(performanceMonitor.middleware());
  console.log('✅ Performance monitoring middleware loaded');
} catch (error) {
  console.error('❌ Performance monitoring middleware failed:', error.message);
}

// ✅ Path normalization check - Prevent trailing slash redirects
app.use((req, res, next) => {
  // Log all API requests for debugging
  if (req.path.startsWith('/api/')) {
    console.log(`🔍 API Request: ${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
    
    // Check for trailing slash issues that might cause redirects
    if (req.path.endsWith('/') && req.path !== '/api/') {
      console.log(`⚠️  Potential trailing slash issue: ${req.path}`);
    }
  }
  next();
});

// ✅ Apply security headers
try {
  app.use(securityHeaders);
  console.log('✅ Security headers middleware loaded');
} catch (error) {
  console.error('❌ Security headers middleware failed:', error.message);
}

// ✅ Apply input sanitization
try {
  app.use(sanitizeInput);
  console.log('✅ Input sanitization middleware loaded');
} catch (error) {
  console.error('❌ Input sanitization middleware failed:', error.message);
}

// ✅ Apply shield security middleware
try {
  app.use(shield);
  console.log('✅ Shield security middleware loaded');
} catch (error) {
  console.error('❌ Shield security middleware failed:', error.message);
}

// ✅ Apply rate limiting
try {
  app.use(generalRateLimit);
  console.log('✅ Rate limiting middleware loaded');
} catch (error) {
  console.error('❌ Rate limiting middleware failed:', error.message);
}

// ✅ Routes with specific rate limiting
app.use('/api/admin', adminRateLimit, require('./routes/admin'));
app.use('/api/auth', authRateLimit, require('./routes/auth'));
app.use('/api/pros', generalRateLimit, require('./routes/proRoutes')); // Pro authentication and management - using general rate limit for registration
app.use("/api/homeowner-lead", require("./routes/homeownerLead")); // Service request handler
app.use("/api/service-request", require("./routes/serviceRequest")); // Alternative service request endpoint
app.use("/api/notify", require("./routes/notify"));
app.use("/api/stripe", require("./routes/stripe")); // Stripe subscription
app.use("/api/subscribe", require("./routes/subscribe")); // Subscription form handler
app.use("/api/upload", require("./routes/upload")); // Cloudinary image upload
app.use("/api/reviews", require("./routes/reviews")); // Professional reviews
app.use("/api", require("./routes/ipinfo")); // IP information proxy
app.use("/api/ai", require("./routes/ai")); // AI assistant route
app.use("/api/contact", require("./routes/contact")); // Contact form route
app.use("/api/referrals", require("./routes/referrals")); // Referral rewards

// ✅ New routes for profile sharing feature
app.use("/api", require("./routes/profiles")); // Profile slug lookup
app.use("/api", require("./routes/share")); // Share events and boost logic
app.use("/api", require("./routes/search")); // Enhanced search with boost scoring
app.use("/api/cloudinary", require("./routes/cloudinary")); // Cloudinary signed uploads
app.use("/api/reviews", require("./routes/reviewCapture")); // Review capture with magic links

// ✅ Simple Subscribe Endpoint for PricingPage.jsx
app.post("/api/subscribe", async (req, res) => {
  try {
    console.log("🔔 Subscription request received:", req.body);
    
    // Verify Stripe is initialized
    if (!stripe) {
      console.error('❌ Stripe not initialized - missing STRIPE_SECRET_KEY');
      return res.status(500).json({ 
        error: 'Payment system not configured',
        message: 'Stripe integration is not properly set up'
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check required environment variables
    const clientUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    
    // Get price ID from environment variables
    const priceId = process.env.STRIPE_FIRST_MONTH_PRICE_ID || 
                   process.env.STRIPE_MONTHLY_PRICE_ID || 
                   process.env.STRIPE_PRICE_ID;
    
    if (!priceId) {
      console.error('❌ No Stripe price ID found in environment variables');
      return res.status(500).json({ 
        error: 'Payment configuration error',
        message: 'Subscription pricing not configured'
      });
    }

    console.log(`💰 Creating subscription checkout session for ${email}`);
    console.log(`🔗 Using client URL: ${clientUrl}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email,
      success_url: `${clientUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-cancel.html`,
      metadata: {
        service: 'fixlo-pro-subscription',
        email: email,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Subscription checkout session created: ${session.id}`);
    res.json({ 
      success: true,
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('❌ Error creating subscription checkout session:', error.message);
    res.status(500).json({ 
      error: 'Payment processing error',
      message: error.message 
    });
  }
});

// ✅ Professional Signup Endpoint (with Stripe Payment Integration)
app.post("/api/pro-signup", async (req, res) => {
  console.log("🔧 Professional signup request:", req.body);
  
  const { name, email, phone, trade, location, dob, role, termsConsent, smsConsent } = req.body;
  
  // Validate required fields
  if (!name || !email || !phone || !trade || !location || !dob) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, email, phone, trade, location, and date of birth are required" 
    });
  }

  // Validate age (must be 18+)
  const birthDate = new Date(dob);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  if (age < 18) {
    return res.status(400).json({
      success: false,
      message: "You must be 18 or older to join Fixlo as a professional"
    });
  }

  try {
    // Check if database is available before proceeding
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ Database not available for professional signup');
      return res.status(503).json({
        success: false,
        message: "Professional signup service is temporarily unavailable. Please try again later or contact support."
      });
    }
    
    // Normalize trade value for consistent checking
    const tradeNormalized = trade.trim().toLowerCase();
    
    // Check for existing professional with same email AND trade
    const existingSameTrade = await Pro.findOne({ 
      email: email.toLowerCase(),
      trade: tradeNormalized
    });
    
    if (existingSameTrade) {
      console.log(`❌ Duplicate professional signup attempt: ${email} already registered for ${trade}`);
      return res.status(409).json({
        success: false,
        message: `You already signed up for ${trade}. Please choose a different trade or contact support.`
      });
    }
    
    // Check for duplicate phone number across all trades (still prevent phone duplication)
    const existingPhone = await Pro.findOne({ phone: phone.trim() });
    if (existingPhone) {
      console.log(`❌ Duplicate phone number: ${phone} already registered`);
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered. Please use a different phone number or contact support."
      });
    }

    // Geocode the location
    console.log(`🗺️  Geocoding location: ${location}`);
    const geoResult = await geocodingService.geocodeLocation(location);
    
    if (!geoResult.coordinates || !geocodingService.validateCoordinates(geoResult.coordinates)) {
      console.error('❌ Invalid coordinates returned from geocoding');
      return res.status(400).json({
        success: false,
        message: "Could not determine location. Please provide a valid ZIP code or address."
      });
    }

    // Create new professional (but don't mark as active until payment)
    const newPro = new Pro({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      trade: tradeNormalized, // Use normalized trade value
      location: {
        type: 'Point',
        coordinates: geoResult.coordinates,
        address: geoResult.address
      },
      dob: birthDate,
      isActive: false, // Will be activated after payment
      paymentStatus: 'pending',
      smsConsent: Boolean(smsConsent) // Store SMS consent preference
    });

    // Save to database
    await newPro.save();
    console.log(`✅ New professional saved (pending payment): ${name} (${email}) - ${trade} in ${location}`);

    // ✅ Checkr Background Check Integration
    if (process.env.CHECKR_API_KEY) {
      try {
        console.log(`🔍 Starting background check for ${name}...`);
        
        // 1. Create candidate with Checkr
        const candidateRes = await axios.post('https://api.checkr.com/v1/candidates', {
          first_name: name.split(' ')[0],
          last_name: name.split(' ')[1] || '',
          email: email,
          phone: phone,
          dob: dob,
          copy_requested: true
        }, {
          auth: { username: process.env.CHECKR_API_KEY, password: '' }
        });

        const candidateId = candidateRes.data.id;
        console.log(`✅ Checkr candidate created: ${candidateId}`);

        // 2. Create invitation for background check
        const invitationRes = await axios.post('https://api.checkr.com/v1/invitations', {
          candidate_id: candidateId,
          package: 'tasker_pro_package'
        }, {
          auth: { username: process.env.CHECKR_API_KEY, password: '' }
        });

        console.log(`✅ Background check invitation sent: ${invitationRes.data.id}`);

        // 3. Update professional record with Checkr candidate ID
        newPro.checkrCandidateId = candidateId;
        newPro.backgroundCheckStatus = 'pending';
        await newPro.save();

      } catch (checkrError) {
        console.error('❌ Checkr integration error:', checkrError.message);
        // Don't fail the signup if background check fails - log it and continue
        console.log('⚠️  Continuing with signup - background check can be initiated manually');
      }
    } else {
      console.log('⚠️  CHECKR_API_KEY not configured - skipping background check');
    }

    // Create Stripe Checkout session
    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      console.error('❌ Stripe secret key not configured');
      return res.status(500).json({
        success: false,
        message: "Payment system not configured. Please contact support."
      });
    }

    const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;
    if (!MONTHLY_PRICE_ID) {
      console.error('❌ Stripe monthly price ID not configured');
      return res.status(500).json({
        success: false,
        message: "Payment pricing not configured. Please contact support."
      });
    }

    console.log(`💳 Creating Stripe checkout session for ${email}`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: MONTHLY_PRICE_ID,
        quantity: 1,
      }],
      mode: 'subscription',
      customer_email: email,
      metadata: {
        professional_id: newPro._id.toString(),
        professional_name: name,
        professional_trade: tradeNormalized, // Use normalized trade value
        professional_location: location
      },
      success_url: `${process.env.CLIENT_URL || 'https://www.fixloapp.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'https://www.fixloapp.com'}/payment-cancel?professional_id=${newPro._id}`,
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    });

    console.log(`✅ Stripe checkout session created: ${session.id}`);
    
    // Update professional record with Stripe session ID
    newPro.stripeSessionId = session.id;
    await newPro.save();

    res.json({ 
      success: true, 
      message: "Professional registration created! Please complete payment to activate your account.",
      data: {
        id: newPro._id,
        name: newPro.name,
        email: newPro.email,
        trade: tradeNormalized, // Use normalized trade value
        location: newPro.location.address,
        paymentStatus: 'pending'
      },
      paymentUrl: session.url
    });

  } catch (error) {
    console.error('❌ Error in professional signup:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email and trade combination is already registered"
      });
    }
    
    // Handle Stripe errors
    if (error.type === 'StripeError') {
      console.error('❌ Stripe error:', error.message);
      return res.status(400).json({
        success: false,
        message: "Payment system error. Please try again later."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

// ✅ Lead Routing Endpoint - Find nearby professionals
app.post("/api/route-lead", async (req, res) => {
  console.log("🎯 Lead routing request:", req.body);
  
  const { trade, location, customerInfo } = req.body;
  
  // Validate required fields
  if (!trade || !location) {
    return res.status(400).json({
      success: false,
      message: "Trade and location are required"
    });
  }

  try {
    // Geocode the customer location
    console.log(`🗺️  Geocoding customer location: ${location}`);
    const geoResult = await geocodingService.geocodeLocation(location);
    
    if (!geoResult.coordinates || !geocodingService.validateCoordinates(geoResult.coordinates)) {
      return res.status(400).json({
        success: false,
        message: "Could not determine location. Please provide a valid ZIP code or address."
      });
    }

    // Find nearby professionals (within 30 miles) - ONLY ACTIVE PROFESSIONALS
    const matchedPros = await Pro.find({
      trade,
      isActive: true, // Only include professionals with active subscriptions
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: geoResult.coordinates },
          $maxDistance: 30 * 1609.34 // 30 miles in meters
        }
      }
    });
    
    if (matchedPros.length === 0) {
      console.log(`❌ No ${trade} professionals found within 30 miles of ${location}`);
      return res.status(404).json({
        success: false,
        message: `No ${trade} professionals found in your area. We're working to expand our network!`
      });
    }

    console.log(`✅ Found ${matchedPros.length} ${trade} professionals within 30 miles`);

    // Calculate distances for each professional
    const prosWithDistance = matchedPros.map(pro => {
      const distance = geocodingService.calculateDistance(
        geoResult.coordinates,
        pro.location.coordinates
      );
      
      return {
        id: pro._id,
        name: pro.name,
        email: pro.email,
        phone: pro.phone,
        rating: pro.rating,
        completedJobs: pro.completedJobs,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        experience: pro.experience,
        isVerified: pro.isVerified
      };
    });

    // Sort by rating first, then by distance
    prosWithDistance.sort((a, b) => {
      if (a.rating !== b.rating) {
        return b.rating - a.rating; // Higher rating first
      }
      return a.distance - b.distance; // Closer distance first
    });

    // TODO: Send notifications to matched professionals
    console.log(`📞 Would notify ${prosWithDistance.length} professionals:`);
    prosWithDistance.forEach(pro => {
      console.log(`  - ${pro.name} (${pro.distance} miles away, ${pro.rating}⭐)`);
    });

    // TODO: Create lead record in database
    // TODO: Send SMS/email notifications to professionals
    // TODO: Send confirmation to customer

    res.json({
      success: true,
      message: `Found ${prosWithDistance.length} ${trade} professionals in your area`,
      data: {
        trade: trade,
        location: geoResult.address,
        coordinates: geoResult.coordinates,
        matchedPros: prosWithDistance,
        searchRadius: 30 // miles
      }
    });

  } catch (error) {
    console.error('❌ Error routing lead:', error);
    res.status(500).json({
      success: false,
      message: "Error finding professionals. Please try again later."
    });
  }
});

// ✅ Get Trade Statistics
app.get("/api/trade-stats", async (req, res) => {
  try {
    const stats = await Pro.getTradeStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error getting trade stats:', error);
    res.status(500).json({
      success: false,
      message: "Error retrieving trade statistics"
    });
  }
});

// ✅ Get Professionals in Area (for admin/debugging)
app.get("/api/pros-in-area", async (req, res) => {
  const { location, radius = 30 } = req.query;
  
  if (!location) {
    return res.status(400).json({
      success: false,
      message: "Location is required"
    });
  }

  try {
    const geoResult = await geocodingService.geocodeLocation(location);
    
    if (!geoResult.coordinates) {
      return res.status(400).json({
        success: false,
        message: "Could not geocode location"
      });
    }

    const pros = await Pro.find({
      isActive: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: geoResult.coordinates
          },
          $maxDistance: radius * 1609.34 // Convert miles to meters
        }
      }
    }).select('name email trade location rating completedJobs isVerified');

    res.json({
      success: true,
      data: {
        location: geoResult.address,
        coordinates: geoResult.coordinates,
        radius: radius,
        count: pros.length,
        professionals: pros
      }
    });

  } catch (error) {
    console.error('❌ Error finding pros in area:', error);
    res.status(500).json({
      success: false,
      message: "Error finding professionals"
    });
  }
});
app.post("/api/pro-signup-proxy", (req, res) => {
  console.log("🔧 Proxy professional signup request:", req.body);
  
  const { name, email, phone, role } = req.body;
  
  if (!name || !email || !phone) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, email, and phone are required" 
    });
  }
  
  // TODO: Save to database and send notifications
  console.log(`📝 New professional signup (proxy): ${name} (${email}) - ${phone}`);
  
  res.json({ 
    success: true, 
    message: "Professional signup received successfully! (via proxy)",
    data: { name, email, phone, role }
  });
});

// ✅ Homeowner Lead Endpoint (Enhanced with Professional Matching)
app.post("/api/homeowner-lead", async (req, res) => {
  console.log("🏠 Homeowner lead request:", req.body);
  
  const { name, phone, address, service, description } = req.body;
  
  if (!name || !phone || !service) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, phone, and service are required" 
    });
  }

  try {
    // Route the lead to find matching professionals
    const routingResult = await findMatchingProfessionals(service, address || 'Unknown');
    
    // TODO: Create lead record in database
    // TODO: Send notifications to matched professionals
    // TODO: Send confirmation to customer
    
    console.log(`📞 New homeowner lead: ${name} (${phone}) needs ${service} at ${address}`);
    
    const responseData = {
      success: true,
      message: "Service request received successfully!",
      customerData: { name, phone, address, service, description },
      matchingInfo: routingResult
    };

    // If no professionals found, still accept the lead but inform customer
    if (!routingResult.success) {
      responseData.message = "Service request received! We're finding the best professionals in your area and will contact you soon.";
    }

    res.json(responseData);

  } catch (error) {
    console.error('❌ Error processing homeowner lead:', error);
    
    // Still accept the lead even if matching fails
    res.json({
      success: true,
      message: "Service request received! We will contact you soon with available professionals.",
      customerData: { name, phone, address, service, description },
      matchingInfo: { success: false, message: "Professional matching will be done manually" }
    });
  }
});

// Helper function to find matching professionals
async function findMatchingProfessionals(service, location) {
  try {
    // Map service names to trade types
    const serviceToTrade = {
      'plumbing': 'plumbing',
      'electrical': 'electrical',
      'landscaping': 'landscaping',
      'cleaning': 'cleaning',
      'house cleaning': 'cleaning',
      'junk removal': 'junk_removal',
      'handyman': 'handyman',
      'hvac': 'hvac',
      'heating': 'hvac',
      'air conditioning': 'hvac',
      'painting': 'painting',
      'roofing': 'roofing',
      'flooring': 'flooring',
      'carpentry': 'carpentry',
      'appliance repair': 'appliance_repair'
    };

    const trade = serviceToTrade[service.toLowerCase()] || 'handyman';
    
    // Geocode the location
    const geoResult = await geocodingService.geocodeLocation(location);
    
    if (!geoResult.coordinates) {
      return { success: false, message: "Could not determine location" };
    }

    // Find nearby professionals - ONLY ACTIVE PROFESSIONALS
    const matchedPros = await Pro.find({
      trade,
      isActive: true, // Only include professionals with active subscriptions
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: geoResult.coordinates },
          $maxDistance: 30 * 1609.34 // 30 miles in meters
        }
      }
    });
    
    return {
      success: true,
      trade: trade,
      location: geoResult.address,
      matchedCount: matchedPros.length,
      professionals: matchedPros.slice(0, 5).map(pro => ({
        id: pro._id,
        name: pro.name,
        rating: pro.rating,
        completedJobs: pro.completedJobs,
        distance: Math.round(
          geocodingService.calculateDistance(geoResult.coordinates, pro.location.coordinates) * 10
        ) / 10
      }))
    };

  } catch (error) {
    console.error('❌ Error finding matching professionals:', error);
    return { success: false, message: "Error finding professionals" };
  }
}

// ✅ Backup Proxy Endpoint for Homeowner Leads
app.post("/api/homeowner-lead-proxy", (req, res) => {
  console.log("🏠 Proxy homeowner lead request:", req.body);
  
  const { name, phone, address, service, description } = req.body;
  
  if (!name || !phone || !service) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, phone, and service are required" 
    });
  }
  
  // TODO: Save to database and notify professionals
  console.log(`📞 New homeowner lead (proxy): ${name} (${phone}) needs ${service} at ${address}`);
  
  res.json({ 
    success: true, 
    message: "Service request received successfully! (via proxy)",
    data: { name, phone, address, service, description }
  });
});

// ✅ Webhook for Checkr (background checks for Fixlo professionals)  
app.post("/webhook/checkr", async (req, res) => {
  console.log("🔔 Checkr webhook received:", req.body);
  
  try {
    const { type, data } = req.body;
    
    // Handle report.completed events
    if (type === 'report.completed') {
      const report = data.object;
      const candidateId = report.candidate_id;
      const status = report.status; // 'clear', 'consider', 'suspended'
      
      console.log(`📋 Background check completed for candidate ${candidateId}: ${status}`);
      
      // Find the professional by Checkr candidate ID and update status
      const professional = await Pro.findOneAndUpdate(
        { checkrCandidateId: candidateId },
        { 
          backgroundCheckStatus: status,
          isVerified: status === 'clear' // Only mark as verified if background check is clear
        },
        { new: true }
      );
      
      if (professional) {
        console.log(`✅ Professional background check status updated: ${professional.name} (${professional.email}) - ${status}`);
        
        // TODO: Send notification to professional about background check results
        // TODO: If status is 'consider' or 'suspended', may need additional review process
        
      } else {
        console.error(`❌ Professional not found for Checkr candidate ID: ${candidateId}`);
      }
      
    } else {
      console.log(`ℹ️  Checkr webhook event type '${type}' - no action needed`);
    }
    
    res.status(200).send("Checkr webhook processed successfully");
    
  } catch (error) {
    console.error('❌ Error processing Checkr webhook:', error);
    res.status(500).send("Webhook processing error");
  }
});

// ✅ Basic health check
app.get("/api", (req, res) => {
  res.json({ 
    message: "Fixlo Backend API is live!", 
    timestamp: new Date().toISOString(),
    cors: "enabled",
    version: "2.2.0-fixlo-professional-backend",
    architecture: "static-frontend-api-backend"
  });
});

// ✅ CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🧪 CORS test request from origin: "${requestOrigin || 'null'}"`);
  
  res.json({ 
    message: "Fixlo CORS is working!", 
    requestOrigin: requestOrigin,
    allowedOrigins: allowedOrigins,
    corsEnabled: true,
    preflightSupported: true,
    originAllowed: !requestOrigin || allowedOrigins.includes(requestOrigin),
    timestamp: new Date().toISOString()
  });
});

// ✅ Environment diagnostic endpoint
app.get("/api/env-check", (req, res) => {
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    MONGO_URI: process.env.MONGO_URI ? 'set ✅' : 'missing ❌',
    JWT_SECRET: process.env.JWT_SECRET ? 'set ✅' : 'missing ❌',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'set ✅' : 'missing ❌',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'set ✅' : 'missing ❌',
    CLIENT_URL: process.env.CLIENT_URL || 'not set ❌ (required for Stripe)',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set ✅' : 'missing ❌',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'set ✅' : 'missing ❌',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'set ✅' : 'missing ❌',
    TWILIO_PHONE: process.env.TWILIO_PHONE || 'not set',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'set ✅' : 'missing ❌ (required for payments)',
    STRIPE_FIRST_MONTH_PRICE_ID: process.env.STRIPE_FIRST_MONTH_PRICE_ID ? 'set ✅' : 'missing ❌',
    STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID ? 'set ✅' : 'missing ❌',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'set ✅' : 'missing ❌ (required for webhooks)',
    CHECKR_API_KEY: process.env.CHECKR_API_KEY ? 'set ✅' : 'missing ❌ (required for background checks)'
  };

  res.json({
    message: "Fixlo Environment Variables Status",
    environment: envStatus,
    timestamp: new Date().toISOString(),
    stripeStatus: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
    webhookStatus: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'not configured',
    webhookEndpoint: '/webhook/stripe',
    paymentReady: process.env.STRIPE_SECRET_KEY && process.env.CLIENT_URL && 
                  (process.env.STRIPE_FIRST_MONTH_PRICE_ID || process.env.STRIPE_MONTHLY_PRICE_ID) ? 
                  'ready ✅' : 'not ready ❌'
  });
});

// ✅ Health check endpoint (works with or without database)
app.get("/api/health", async (req, res) => {
  try {
    // Check database connection if available
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    let databaseInfo = {
      state: states[dbState],
      available: dbState === 1
    };
    
    // Only try database operations if connected
    if (dbState === 1) {
      try {
        // Check if models exist before using them
        if (mongoose.models.Pro) {
          databaseInfo.prosCount = await mongoose.model('Pro').countDocuments();
        }
        if (mongoose.models.JobRequest) {
          databaseInfo.requestsCount = await mongoose.model('JobRequest').countDocuments();
        }
      } catch (dbErr) {
        databaseInfo.error = `Database query failed: ${dbErr.message}`;
      }
    }
    
    res.json({
      status: 'healthy',
      message: 'Fixlo API is running',
      database: databaseInfo,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      version: '2.3.0'
    });
  } catch (err) {
    res.status(200).json({
      status: 'partial',
      message: 'Fixlo API is running (database issues)',
      error: err.message,
      database: 'unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Comprehensive performance monitoring endpoint
app.get("/api/monitoring", async (req, res) => {
  try {
    const healthSummary = await performanceMonitor.getHealthSummary();
    res.json({
      status: 'operational',
      message: 'Fixlo API monitoring data',
      ...healthSummary
    });
  } catch (error) {
    console.error('❌ Error generating monitoring data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate monitoring data',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Status API endpoint (alternative endpoint that might be called by external services)
app.get("/status-api", (req, res) => {
  console.log(`🔍 Status API request from origin: ${req.headers.origin || 'unknown'}`);
  res.json({ 
    status: 'operational',
    message: "Fixlo Backend API is live!", 
    timestamp: new Date().toISOString(),
    cors: "enabled",
    version: "2.3.0-fixlo-backend",
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ MongoDB connection (optional - app works without it)
if (process.env.MONGO_URI) {
  console.log("🔍 Connecting to MongoDB...");
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // 10 second timeout
    socketTimeoutMS: 45000, // 45 second socket timeout
    bufferCommands: false, // Disable mongoose buffering
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain a minimum of 5 socket connections
    retryWrites: true
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Connection state: ${mongoose.connection.readyState}`);
    
    // Initialize database optimization
    DatabaseOptimizer.initialize();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("🔧 Continuing without database (API still functional)...");
  });

  // Monitor MongoDB connection (non-fatal errors)
  mongoose.connection.on('error', (err) => {
    console.error('⚠️ MongoDB error (non-fatal):', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected (continuing without database)');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });

  mongoose.connection.on('connecting', () => {
    console.log('🔄 MongoDB connecting...');
  });

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });
} else {
  console.log("📝 No MONGO_URI provided - running in database-free mode");
}

// ✅ API-only backend - No frontend serving needed
// Frontend is served by Vercel at https://fixloapp.com
console.log(`� Fixlo backend running in API-only mode`);

// ✅ Global error handler (must be last middleware)
app.use(errorHandler);

// ✅ Root route for Render health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Fixlo Backend is running!", 
    status: "healthy",
    timestamp: new Date().toISOString(),
    cors: "enabled for fixloapp.com, www.fixloapp.com, localhost:3000",
    preflightSupported: true
  });
});

// ✅ Admin dashboard route - FIXED
app.get("/admin", (req, res) => {
  console.log('🔐 Admin dashboard accessed');
  const adminPath = path.join(__dirname, 'admin.html');
  console.log('Admin file path:', adminPath);
  
  // Check if file exists first
  const fs = require('fs');
  if (!fs.existsSync(adminPath)) {
    console.log('❌ Admin file not found at:', adminPath);
    return res.status(404).json({
      error: 'Admin file not found',
      path: adminPath,
      files: fs.readdirSync(__dirname)
    });
  }
  
  res.sendFile(adminPath);
});

// ✅ Simple admin test route
app.get("/admin-test", (req, res) => {
  res.json({
    message: "Admin route is working!",
    timestamp: new Date().toISOString(),
    adminFile: require('fs').existsSync(path.join(__dirname, 'admin.html'))
  });
});

// ✅ Socket.io connection handling
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  // Handle user joining a chat room
  socket.on('join-room', (userData) => {
    const { userId, userName, chatType } = userData;
    console.log(`👤 User ${userName} (${userId}) joined ${chatType} chat`);
    
    // Store user info
    activeUsers.set(socket.id, { userId, userName, chatType });
    
    // Join the room
    socket.join(chatType);
    
    // Notify others in the room
    socket.to(chatType).emit('user-joined', { userId, userName });
    
    // Send current online users to the new user
    const onlineUsers = Array.from(activeUsers.values())
      .filter(user => user.chatType === chatType);
    socket.emit('online-users', onlineUsers);
  });
  
  // Handle sending messages
  socket.on('send-message', (messageData) => {
    const { userId, userName, content, chatType, timestamp } = messageData;
    console.log(`💬 Message from ${userName}: ${content.substring(0, 50)}...`);
    
    // Broadcast message to all users in the room
    io.to(chatType).emit('message', {
      userId,
      userName,
      content,
      timestamp,
      type: 'user'
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    const userData = activeUsers.get(socket.id);
    if (userData) {
      const { userId, userName, chatType } = userData;
      
      // Notify others in the room
      socket.to(chatType).emit('user-left', { userId, userName });
      
      // Remove from active users
      activeUsers.delete(socket.id);
    }
  });
});

// ✅ Start Fixlo server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Fixlo Backend running on port ${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n🔗 CORS Configuration:`);
  console.log(`📋 Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`🌐 Environment Variable: ${process.env.CORS_ALLOWED_ORIGINS || 'not set (using defaults)'}`);
  console.log(`✅ Both www.fixloapp.com and fixloapp.com are allowed`);
  console.log(`✅ CORS preflight OPTIONS requests enabled for all routes`);
  console.log(`✅ Fixlo Backend v2.3.0 - API-only mode - No frontend serving`);
  console.log(`\n🧪 Test CORS with: curl -H "Origin: https://www.fixloapp.com" -X OPTIONS https://fixloapp.onrender.com/api/cors-test`);
});

// ✅ Stripe Webhook Endpoint (for payment confirmation)
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Stripe webhook received: ${event.type}`);

  // Subscription created or renewed
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'invoice.payment_succeeded'
  ) {
    const session = event.data.object;
    console.log('✅ Payment successful:', session.id);

    // Lookup by email or customer_id
    const email = session.customer_email;
    const subscriptionId = session.subscription;

    try {
      const pro = await Pro.findOneAndUpdate(
        { email },
        {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: session.customer,
          isActive: true,
          paymentStatus: 'active',
          subscriptionStartDate: new Date()
        },
        { new: true }
      );

      if (pro) {
        console.log(`✅ Professional activated: ${pro.name} (${pro.email})`);
      } else {
        console.error(`❌ Professional not found for email: ${email}`);
      }
    } catch (error) {
      console.error('❌ Error activating professional:', error);
    }
  }

  // Subscription canceled or payment failed
  if (
    event.type === 'customer.subscription.deleted' ||
    event.type === 'invoice.payment_failed'
  ) {
    const subscription = event.data.object;
    const subscriptionId = subscription.id;
    console.log(`❌ Subscription issue: ${event.type} - ${subscriptionId}`);

    try {
      const pro = await Pro.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        { 
          isActive: false,
          paymentStatus: event.type === 'customer.subscription.deleted' ? 'cancelled' : 'failed',
          subscriptionEndDate: new Date()
        },
        { new: true }
      );

      if (pro) {
        console.log(`❌ Professional deactivated: ${pro.name} (${pro.email})`);
      } else {
        console.error(`❌ Professional not found for subscription: ${subscriptionId}`);
      }
    } catch (error) {
      console.error('❌ Error deactivating professional:', error);
    }
  }

  res.sendStatus(200);
});

// ✅ Payment Success Page Data
app.get('/api/payment-success/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const professional = await Pro.findOne({ stripeSessionId: sessionId });
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        name: professional.name,
        email: professional.email,
        trade: professional.trade,
        location: professional.location.address,
        isActive: professional.isActive,
        paymentStatus: professional.paymentStatus,
        joinedDate: professional.joinedDate
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching payment success data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ Payment Cancel Handler
app.post('/api/payment-cancel/:professionalId', async (req, res) => {
  const { professionalId } = req.params;
  
  try {
    // Clean up pending professional record
    await Pro.findByIdAndDelete(professionalId);
    
    console.log(`🗑️  Removed pending professional record: ${professionalId}`);
    
    res.json({
      success: true,
      message: 'Payment cancelled. Professional record removed.'
    });
    
  } catch (error) {
    console.error('❌ Error handling payment cancellation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ✅ Subscription Status Endpoint (for admin monitoring)
app.get("/api/subscription-status", async (req, res) => {
  try {
    const activeCount = await Pro.countDocuments({ isActive: true });
    const inactiveCount = await Pro.countDocuments({ isActive: false });
    const totalCount = await Pro.countDocuments();
    
    const subscriptionStats = await Pro.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentActivations = await Pro.find({ 
      isActive: true, 
      subscriptionStartDate: { $exists: true }
    })
    .sort({ subscriptionStartDate: -1 })
    .limit(10)
    .select('name email trade subscriptionStartDate paymentStatus');
    
    res.json({
      success: true,
      data: {
        summary: {
          totalProfessionals: totalCount,
          activeProfessionals: activeCount,
          inactiveProfessionals: inactiveCount,
          activationRate: totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : 0
        },
        paymentStatusBreakdown: subscriptionStats,
        recentActivations: recentActivations
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: "Error retrieving subscription status"
    });
  }
});
