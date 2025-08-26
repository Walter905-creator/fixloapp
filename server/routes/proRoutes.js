const express = require('express');
let bcrypt, jwt, Pro, Review, upload, auth;

// Safely load dependencies
try {
  bcrypt = require('bcryptjs');
} catch (error) {
  console.warn('⚠️ bcryptjs not available:', error.message);
}

try {
  jwt = require('jsonwebtoken');
} catch (error) {
  console.warn('⚠️ jsonwebtoken not available:', error.message);
}

try {
  Pro = require('../models/Pro');
} catch (error) {
  console.warn('⚠️ Pro model not available:', error.message);
}

try {
  Review = require('../models/Review');
} catch (error) {
  console.warn('⚠️ Review model not available:', error.message);
}

try {
  const cloudinaryUtils = require('../utils/cloudinary');
  upload = cloudinaryUtils.upload;
} catch (error) {
  console.warn('⚠️ Cloudinary upload not available:', error.message);
}

try {
  auth = require('../middleware/auth');
} catch (error) {
  console.warn('⚠️ Auth middleware not available:', error.message);
}

const router = express.Router();

// Test endpoint to verify router is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Professional routes are working!',
    timestamp: new Date().toISOString(),
    available: {
      bcrypt: !!bcrypt,
      jwt: !!jwt,
      Pro: !!Pro,
      Review: !!Review,
      upload: !!upload,
      auth: !!auth
    }
  });
});

// OPTIONS handlers for professional endpoints
router.options("/register", (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🎯 OPTIONS /api/pros/register from origin: "${requestOrigin || 'null'}"`);
  
  res.header('Access-Control-Allow-Origin', requestOrigin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

router.options("/login", (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🎯 OPTIONS /api/pros/login from origin: "${requestOrigin || 'null'}"`);
  
  res.header('Access-Control-Allow-Origin', requestOrigin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

router.options("/dashboard", (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🎯 OPTIONS /api/pros/dashboard from origin: "${requestOrigin || 'null'}"`);
  
  res.header('Access-Control-Allow-Origin', requestOrigin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// Register new pro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, trade, location, dob } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !trade || !location || !dob) {
      return res.status(400).json({ 
        error: 'All fields are required: name, email, password, phone, trade, location, dob'
      });
    }

    // Check if required dependencies are available
    if (!bcrypt) {
      console.error('❌ bcrypt not available for professional registration');
      return res.status(503).json({ 
        error: 'Registration service configuration error',
        message: 'Password encryption not available. Please contact support.'
      });
    }

    if (!jwt) {
      console.error('❌ jsonwebtoken not available for professional registration');
      return res.status(503).json({ 
        error: 'Registration service configuration error', 
        message: 'Authentication system not available. Please contact support.'
      });
    }

    // Check JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(503).json({ 
        error: 'Authentication system not configured',
        message: 'Please contact support.'
      });
    }

    // Check if database connection is available
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected for professional registration');
      return res.status(503).json({ 
        error: 'Registration service temporarily unavailable',
        message: 'Database connection issue. Please try again later.'
      });
    }

    // Check if Pro model is available
    if (!Pro || typeof Pro.findOne !== 'function') {
      console.error('❌ Pro model not available for professional registration');
      return res.status(503).json({ 
        error: 'Registration service temporarily unavailable',
        message: 'Database model not available. Please try again later.'
      });
    }

    // Check if pro already exists
    const existingPro = await Pro.findOne({ $or: [{ email }, { phone }] });
    if (existingPro) {
      return res.status(400).json({ 
        error: 'Professional with this email or phone already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new pro
    const newPro = new Pro({
      name,
      email,
      password: hashedPassword,
      phone,
      trade,
      location: {
        address: location,
        coordinates: [-74.006, 40.7128] // Default to NYC, should be geocoded
      },
      dob: new Date(dob)
    });

    await newPro.save();

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(500).json({ 
        error: 'Authentication system not configured',
        message: 'Please contact support'
      });
    }

    const token = jwt.sign(
      { proId: newPro._id, email: newPro.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Professional registered successfully',
      token,
      pro: {
        id: newPro._id,
        name: newPro.name,
        email: newPro.email,
        trade: newPro.trade,
        location: newPro.location
      }
    });
  } catch (error) {
    console.error('Pro registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// GET handler for login endpoint - return 405 Method Not Allowed
router.get('/login', (req, res) => {
  console.log(`❌ GET method not allowed for /api/pros/login from origin: "${req.headers.origin || 'null'}"`);
  
  res.set('Allow', 'POST, OPTIONS');
  res.status(405).json({
    success: false,
    error: 'Method GET not allowed. Use POST for login.',
    allowedMethods: ['POST', 'OPTIONS'],
    hint: 'Make sure your frontend is sending a POST request to this endpoint.'
  });
});

// Login pro
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Check if required dependencies are available
    if (!bcrypt || !jwt) {
      console.error('❌ Missing required dependencies for professional login');
      return res.status(503).json({ 
        error: 'Login service temporarily unavailable',
        message: 'Please try again later or contact support'
      });
    }

    // Check if database connection is available
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected for professional login');
      
      // For development mode without database, provide a mock response
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using mock login response');
        
        // Generate mock JWT token if JWT_SECRET is available
        if (process.env.JWT_SECRET) {
          const mockToken = jwt.sign(
            { proId: 'dev-mock-id', email: email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          return res.json({
            message: 'Login successful (development mode)',
            token: mockToken,
            pro: {
              id: 'dev-mock-id',
              name: 'Dev Professional',
              email: email,
              trade: 'handyman',
              location: { address: 'Development Mode' },
              profileImage: null,
              rating: 4.5,
              completedJobs: 10
            }
          });
        }
      }
      
      return res.status(503).json({ 
        error: 'Login service temporarily unavailable',
        message: 'Database connection issue. Please try again later.'
      });
    }

    // Check if Pro model is available
    if (!Pro || typeof Pro.findOne !== 'function') {
      console.error('❌ Pro model not available for professional login');
      return res.status(503).json({ 
        error: 'Login service temporarily unavailable',
        message: 'Database model not available. Please try again later.'
      });
    }

    // Find pro by email
    const pro = await Pro.findOne({ email });
    if (!pro) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, pro.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(500).json({ 
        error: 'Authentication system not configured',
        message: 'Please contact support'
      });
    }

    const token = jwt.sign(
      { proId: pro._id, email: pro.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      pro: {
        id: pro._id,
        name: pro.name,
        email: pro.email,
        trade: pro.trade,
        location: pro.location,
        profileImage: pro.profileImage,
        rating: pro.rating,
        completedJobs: pro.completedJobs
      }
    });
  } catch (error) {
    console.error('Pro login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get pro dashboard info
router.get('/dashboard', auth, async (req, res) => {
  try {
    const pro = await Pro.findById(req.proId)
      .populate('reviews')
      .select('-password');

    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    res.json({
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
        paymentStatus: pro.paymentStatus
      }
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard' });
  }
});

// Upload profile image
router.post('/upload/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const pro = await Pro.findById(req.proId);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    pro.profileImage = req.file.path;
    await pro.save();

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: pro.profileImage
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: 'Server error uploading image' });
  }
});

// Upload gallery images
router.post('/upload/gallery', auth, upload.array('galleryImages', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const pro = await Pro.findById(req.proId);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    const newImages = req.files.map(file => file.path);
    pro.gallery.push(...newImages);
    await pro.save();

    res.json({
      message: 'Gallery images uploaded successfully',
      gallery: pro.gallery
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ error: 'Server error uploading images' });
  }
});

// Add a review for the pro
router.post('/reviews', async (req, res) => {
  try {
    const { proId, rating, comment, reviewer } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if pro exists
    const pro = await Pro.findById(proId);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Create new review
    const newReview = new Review({
      pro: proId,
      rating,
      comment,
      reviewer
    });

    await newReview.save();

    // Add review to pro's reviews array
    pro.reviews.push(newReview._id);
    
    // Update pro's rating
    const allReviews = await Review.find({ pro: proId });
    const avgRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
    pro.rating = Math.round(avgRating * 10) / 10; // Round to 1 decimal place
    
    await pro.save();

    res.status(201).json({
      message: 'Review added successfully',
      review: newReview,
      newRating: pro.rating
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Server error adding review' });
  }
});

// Get reviews for a pro
router.get('/reviews/:proId', async (req, res) => {
  try {
    const { proId } = req.params;
    
    const reviews = await Review.find({ pro: proId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error fetching reviews' });
  }
});

// Add missing routes that frontend expects (fallback endpoints)
// Forward to main server's pro-signup logic

// Helper function to forward to main pro-signup endpoint
async function forwardToProSignup(req, res) {
  try {
    // Since we're in the same server process, we can call the signup logic directly
    // Import the required dependencies
    const mongoose = require('mongoose');
    
    const { name, email, phone, trade, location, dob, role, termsConsent, smsConsent } =
      req.body || {};

    if (!name || !email || !phone || !trade || !location || !dob) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, trade, location, and date of birth are required",
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
        message: "Professional signup is temporarily unavailable. Please try again later.",
      });
    }

    const tradeNormalized = String(trade).trim().toLowerCase();

    // Check for duplicates by email+trade
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

    try {
      const { ENABLE_BG_CHECKS } = require('../config/flags');
      if (!ENABLE_BG_CHECKS) {
        verificationStatus = 'skipped';
        verificationNotes = 'Background checks temporarily disabled by config.';
      }
    } catch (e) {
      // If flags config is not available, use default
      console.warn('⚠️ Feature flags not available, using defaults');
    }

    // Create the professional
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
}

// Missing route 1: /api/pros/signup
router.post('/signup', forwardToProSignup);

// Missing route 2: /api/pros (POST to base route) 
router.post('/', forwardToProSignup);

module.exports = router;