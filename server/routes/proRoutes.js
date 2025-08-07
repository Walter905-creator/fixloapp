const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Pro = require('../models/Pro');
const Review = require('../models/Review');
const { upload } = require('../utils/cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();

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

    // Check if required dependencies are available
    if (!bcrypt || !jwt) {
      console.error('❌ Missing required dependencies for professional registration');
      return res.status(503).json({ 
        error: 'Registration service temporarily unavailable',
        message: 'Please try again later or contact support'
      });
    }

    // Check if Pro model is available (database connection)
    if (!Pro || typeof Pro.findOne !== 'function') {
      console.error('❌ Database not available for professional registration');
      return res.status(503).json({ 
        error: 'Registration service temporarily unavailable',
        message: 'Database connection issue. Please try again later.'
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

// Login pro
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if required dependencies are available
    if (!bcrypt || !jwt) {
      console.error('❌ Missing required dependencies for professional login');
      return res.status(503).json({ 
        error: 'Login service temporarily unavailable',
        message: 'Please try again later or contact support'
      });
    }

    // Check if Pro model is available (database connection)
    if (!Pro || typeof Pro.findOne !== 'function') {
      console.error('❌ Database not available for professional login');
      return res.status(503).json({ 
        error: 'Login service temporarily unavailable',
        message: 'Database connection issue. Please try again later.'
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

module.exports = router;