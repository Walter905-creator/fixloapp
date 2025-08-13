const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Review = require('../models/Review');
const Pro = require('../models/Pro');

// Generate magic review link
function generateMagicToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Store for magic tokens (in production, use Redis or database)
const magicTokens = new Map();

// POST /api/reviews/generate-magic-link
// Generate a magic link for review capture
router.post('/generate-magic-link', async (req, res) => {
  try {
    const { proId, jobId, customerEmail, customerName } = req.body;
    
    if (!proId || !customerEmail) {
      return res.status(400).json({ error: 'Professional ID and customer email are required' });
    }

    // Verify professional exists
    const pro = await Pro.findById(proId);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Generate magic token
    const token = generateMagicToken();
    
    // Store token data (expires in 30 days)
    const tokenData = {
      proId,
      jobId: jobId || null,
      customerEmail,
      customerName: customerName || null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    magicTokens.set(token, tokenData);

    // Create magic link
    const baseUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    const magicLink = `${baseUrl}/review/${token}`;

    res.json({
      success: true,
      magicLink,
      token,
      expiresAt: tokenData.expiresAt
    });
  } catch (error) {
    console.error('Magic link generation error:', error);
    res.status(500).json({ error: 'Failed to generate review link' });
  }
});

// GET /api/reviews/magic/:token
// Retrieve review context from magic token
router.get('/magic/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const tokenData = magicTokens.get(token);
    if (!tokenData) {
      return res.status(404).json({ error: 'Invalid or expired review link' });
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      magicTokens.delete(token);
      return res.status(404).json({ error: 'Review link has expired' });
    }

    // Get professional details
    const pro = await Pro.findById(tokenData.proId)
      .select('name businessName firstName lastName primaryService trade city state slug');
    
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    const displayName = pro.businessName || `${pro.firstName || ''} ${pro.lastName || ''}`.trim() || pro.name;
    const service = pro.primaryService || pro.trade;
    const location = [pro.city, pro.state].filter(Boolean).join(', ');

    res.json({
      success: true,
      pro: {
        id: pro._id,
        name: displayName,
        service,
        location,
        slug: pro.slug
      },
      customer: {
        email: tokenData.customerEmail,
        name: tokenData.customerName
      },
      jobId: tokenData.jobId
    });
  } catch (error) {
    console.error('Magic token retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve review context' });
  }
});

// POST /api/reviews/submit-magic
// Submit review via magic link
router.post('/submit-magic', async (req, res) => {
  try {
    const { token, rating, text, photos = [], homeownerName } = req.body;
    
    if (!token || !rating) {
      return res.status(400).json({ error: 'Token and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const tokenData = magicTokens.get(token);
    if (!tokenData) {
      return res.status(404).json({ error: 'Invalid or expired review link' });
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      magicTokens.delete(token);
      return res.status(404).json({ error: 'Review link has expired' });
    }

    // Create review
    const review = new Review({
      proId: tokenData.proId,
      rating,
      text: text || '',
      photos: photos.filter(Boolean),
      homeownerName: homeownerName || tokenData.customerName,
      customerEmail: tokenData.customerEmail,
      customerName: tokenData.customerName,
      jobDate: new Date(),
      verified: true, // Magic link reviews are considered verified
      ip: req.ip || req.connection.remoteAddress
    });

    await review.save();

    // Update professional's rating
    const pro = await Pro.findById(tokenData.proId);
    if (pro) {
      const reviewStats = await Review.getAverageRating(tokenData.proId);
      pro.avgRating = reviewStats.averageRating || 0;
      pro.reviewCount = reviewStats.totalReviews || 0;
      await pro.save();
    }

    // Invalidate the token (one-time use)
    magicTokens.delete(token);

    res.json({
      success: true,
      review: {
        id: review._id,
        rating: review.rating,
        text: review.text,
        homeownerName: review.homeownerName,
        createdAt: review.createdAt
      },
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Magic review submission error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/reviews/public/:reviewId
// Get public review for SEO (with schema.org markup)
router.get('/public/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId)
      .populate('proId', 'name businessName firstName lastName primaryService trade city state slug')
      .exec();
    
    if (!review || review.status !== 'published') {
      return res.status(404).json({ error: 'Review not found' });
    }

    const pro = review.proId;
    const displayName = pro.businessName || `${pro.firstName || ''} ${pro.lastName || ''}`.trim() || pro.name;
    const service = pro.primaryService || pro.trade;
    const location = [pro.city, pro.state].filter(Boolean).join(', ');

    // Generate schema.org Review markup
    const schema = {
      "@context": "https://schema.org",
      "@type": "Review",
      "itemReviewed": {
        "@type": "LocalBusiness",
        "name": displayName,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": pro.city,
          "addressRegion": pro.state
        },
        "priceRange": "$$"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5,
        "worstRating": 1
      },
      "author": {
        "@type": "Person",
        "name": review.homeownerName || review.customerName || "Verified Customer"
      },
      "reviewBody": review.text || review.comment || "",
      "datePublished": review.createdAt.toISOString()
    };

    res.json({
      success: true,
      review: {
        id: review._id,
        rating: review.rating,
        text: review.text || review.comment,
        authorName: review.homeownerName || review.customerName,
        createdAt: review.createdAt,
        photos: review.photos
      },
      pro: {
        name: displayName,
        service,
        location,
        slug: pro.slug
      },
      schema
    });
  } catch (error) {
    console.error('Public review retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve review' });
  }
});

module.exports = router;