const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Pro = require('../models/Pro');
const mongoose = require('mongoose');

// Get reviews for a specific professional
router.get('/:proId', async (req, res) => {
  try {
    const { proId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    console.log(`📖 Getting reviews for pro: ${proId}, sortBy: ${sortBy}`);

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

module.exports = router;