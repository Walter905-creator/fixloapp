const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Pro = require('../models/Pro');
const mongoose = require('mongoose');

// Minimal sanitizer for text (server-side)
function sanitize(s = '') {
  return s.replace(/[<>]/g, '');
}

// Recompute aggregates when a review moves to published
async function recomputeAggregates(proId) {
  const agg = await Review.aggregate([
    { $match: { proId: require('mongoose').Types.ObjectId.createFromHexString(proId), status: 'published' } },
    { $group: { _id: '$proId', count: { $sum: 1 }, avg: { $avg: '$rating' } } }
  ]);
  const stats = agg[0] || { count: 0, avg: 0 };
  await Pro.findByIdAndUpdate(proId, {
    $set: { avgRating: Math.round((stats.avg || 0) * 10) / 10, reviewCount: stats.count }
  });
}

// List published reviews (public) - Enhanced version
router.get('/profiles/:proId/reviews', async (req, res) => {
  try {
    const { proId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(50, parseInt(req.query.pageSize || '10', 10)));

    const [items, total] = await Promise.all([
      Review.find({ proId, status: 'published' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('rating text photos homeownerName homeownerCity createdAt')
        .lean(),
      Review.countDocuments({ proId, status: 'published' })
    ]);

    res.json({ ok: true, items, total, page, pageSize });
  } catch (e) {
    console.error('list reviews error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a review (public write, basic anti-abuse) - Enhanced version
router.post('/profiles/:proId/reviews', async (req, res) => {
  try {
    const { proId } = req.params;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    const { rating, text, homeownerName, homeownerCity, photos = [] } = req.body || {};

    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating' });
    const safe = {
      proId,
      rating: Number(rating),
      text: sanitize(text || ''),
      homeownerName: sanitize(homeownerName || 'Homeowner'),
      homeownerCity: sanitize(homeownerCity || ''),
      photos: Array.isArray(photos) ? photos.slice(0, 8) : [],
      ip
    };

    // naive rate-limit by IP per pro (5/day). Replace with Redis if needed.
    const since = new Date(Date.now() - 24*60*60*1000);
    const count = await Review.countDocuments({ proId, ip, createdAt: { $gte: since } });
    if (count >= 5) return res.status(429).json({ error: 'Too many reviews from this IP today' });

    const created = await Review.create(safe);

    // If auto-published, recompute aggregates now.
    if (created.status === 'published') await recomputeAggregates(proId);

    res.status(201).json({ ok: true, id: created._id, status: created.status });
  } catch (e) {
    console.error('create review error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reviews for a specific professional
router.get('/:proId', async (req, res) => {
  try {
    const { proId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    console.log(`📖 Getting reviews for pro: ${proId}, sortBy: ${sortBy}`);

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        message: 'Database connection issue. Please try again later.'
      });
    }

    // Validate proId
    if (!mongoose.Types.ObjectId.isValid(proId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid professional ID'
      });
    }

    // Check if professional exists
    const pro = await Pro.findById(proId);
    if (!pro) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order based on sortBy parameter
    let sortOrder = { createdAt: -1 }; // Default: newest first
    switch (sortBy) {
      case 'oldest':
        sortOrder = { createdAt: 1 };
        break;
      case 'highest':
        sortOrder = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOrder = { rating: 1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortOrder = { createdAt: -1 };
        break;
    }

    // Get reviews with pagination
    const reviews = await Review.find({ proId })
      .sort(sortOrder)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-customerEmail') // Don't expose customer email in public API
      .lean();

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({ proId });

    // Calculate detailed rating statistics
    const ratingStats = await Review.aggregate([
      { $match: { proId: new mongoose.Types.ObjectId(proId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
        }
      }
    ]);

    const statsResult = ratingStats.length > 0 ? ratingStats[0] : {
      averageRating: 0,
      totalReviews: 0,
      rating1: 0,
      rating2: 0,
      rating3: 0,
      rating4: 0,
      rating5: 0
    };

    console.log(`✅ Found ${reviews.length} reviews for pro ${proId}`);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalReviews,
          pages: Math.ceil(totalReviews / parseInt(limit))
        },
        stats: {
          averageRating: statsResult.averageRating || 0,
          totalReviews: statsResult.totalReviews || 0,
          ratingBreakdown: {
            1: statsResult.rating1 || 0,
            2: statsResult.rating2 || 0,
            3: statsResult.rating3 || 0,
            4: statsResult.rating4 || 0,
            5: statsResult.rating5 || 0
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

// Post a new review for a professional
router.post('/', async (req, res) => {
  try {
    const { proId, customerName, customerEmail, rating, comment, jobDate } = req.body;

    console.log('📝 Creating new review:', { proId, customerName, rating });

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        message: 'Database connection issue. Please try again later.'
      });
    }

    // Validate required fields
    if (!proId || !customerName || !customerEmail || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: proId, customerName, customerEmail, rating, comment'
      });
    }

    // Validate proId
    if (!mongoose.Types.ObjectId.isValid(proId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid professional ID'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Validate comment length
    if (comment.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be 1000 characters or less'
      });
    }

    // Check if professional exists
    const pro = await Pro.findById(proId);
    if (!pro) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found'
      });
    }

    // Check for duplicate review from same email for this pro (optional business rule)
    const existingReview = await Review.findOne({ 
      proId, 
      customerEmail: customerEmail.toLowerCase() 
    });
    
    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: 'You have already reviewed this professional'
      });
    }

    // Create new review
    const review = new Review({
      proId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      rating: parseInt(rating),
      comment: comment.trim(),
      jobDate: jobDate ? new Date(jobDate) : new Date()
    });

    await review.save();

    console.log('✅ Review created successfully:', review._id);

    // Return review without email
    const reviewResponse = review.toObject();
    delete reviewResponse.customerEmail;

    res.status(201).json({
      success: true,
      data: reviewResponse,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('❌ Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create review'
    });
  }
});

// Get review statistics for a professional
router.get('/:proId/stats', async (req, res) => {
  try {
    const { proId } = req.params;

    console.log(`📊 Getting review stats for pro: ${proId}`);

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        message: 'Database connection issue. Please try again later.'
      });
    }

    // Validate proId
    if (!mongoose.Types.ObjectId.isValid(proId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid professional ID'
      });
    }

    // Get detailed rating statistics
    const stats = await Review.aggregate([
      { $match: { proId: new mongoose.Types.ObjectId(proId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      averageRating: 0,
      totalReviews: 0,
      fiveStars: 0,
      fourStars: 0,
      threeStars: 0,
      twoStars: 0,
      oneStar: 0
    };

    // Remove the _id field
    delete result._id;

    console.log('✅ Review stats calculated:', result);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Get review stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review statistics'
    });
  }
});

// Admin moderation routes (secure these with admin auth in your stack)
router.post('/admin/reviews/:id/publish', async (req, res) => {
  try {
    const r = await Review.findByIdAndUpdate(req.params.id, { $set: { status: 'published' } }, { new: true });
    if (!r) return res.status(404).json({ error: 'Not found' });
    await recomputeAggregates(String(r.proId));
    res.json({ ok: true });
  } catch (e) {
    console.error('publish review error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/admin/reviews/:id/reject', async (req, res) => {
  try {
    const r = await Review.findByIdAndUpdate(req.params.id, { $set: { status: 'rejected' } }, { new: true });
    if (!r) return res.status(404).json({ error: 'Not found' });
    await recomputeAggregates(String(r.proId));
    res.json({ ok: true });
  } catch (e) {
    console.error('reject review error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;