import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const router = express.Router();

// MongoDB connection
let db = null;

async function initDB() {
  if (!db) {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixlo');
    await client.connect();
    db = client.db('fixlo');
  }
  return db;
}

// Submit a review for a professional
router.post('/submit', async (req, res) => {
  try {
    const { 
      professionalId, 
      homeownerName, 
      homeownerEmail, 
      homeownerPhone,
      rating, 
      reviewText, 
      serviceType,
      projectDate 
    } = req.body;

    // Validation
    if (!professionalId || !homeownerName || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Professional ID, homeowner name, rating, and review text are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const database = await initDB();
    const reviews = database.collection('reviews');
    const professionals = database.collection('professionals');

    // Check if professional exists
    const professional = await professionals.findOne({ _id: new ObjectId(professionalId) });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    // Create review document
    const review = {
      professionalId: new ObjectId(professionalId),
      homeownerName,
      homeownerEmail,
      homeownerPhone,
      rating: parseInt(rating),
      reviewText,
      serviceType,
      projectDate: projectDate ? new Date(projectDate) : null,
      createdAt: new Date(),
      isApproved: true, // Auto-approve for now, can add moderation later
      isPublic: true
    };

    const result = await reviews.insertOne(review);

    // Update professional's rating and review count
    const professionalReviews = await reviews.find({ 
      professionalId: new ObjectId(professionalId),
      isApproved: true 
    }).toArray();

    const totalReviews = professionalReviews.length;
    const averageRating = totalReviews > 0 
      ? professionalReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    await professionals.updateOne(
      { _id: new ObjectId(professionalId) },
      { 
        $set: { 
          rating: parseFloat(averageRating.toFixed(2)),
          reviewCount: totalReviews
        }
      }
    );

    console.log(`⭐ New review submitted for professional ${professionalId}: ${rating} stars`);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        id: result.insertedId,
        ...review
      }
    });

  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
});

// Get reviews for a professional
router.get('/professional/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    const database = await initDB();
    const reviews = database.collection('reviews');

    // Build sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'highest':
        sortCriteria = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortCriteria = { rating: 1, createdAt: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviewList = await reviews
      .find({ 
        professionalId: new ObjectId(professionalId),
        isApproved: true,
        isPublic: true 
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalCount = await reviews.countDocuments({ 
      professionalId: new ObjectId(professionalId),
      isApproved: true,
      isPublic: true 
    });

    // Calculate rating breakdown
    const ratingBreakdown = await reviews.aggregate([
      { 
        $match: { 
          professionalId: new ObjectId(professionalId),
          isApproved: true,
          isPublic: true 
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]).toArray();

    // Calculate average rating
    const allReviews = await reviews.find({ 
      professionalId: new ObjectId(professionalId),
      isApproved: true,
      isPublic: true 
    }).toArray();

    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
      : 0;

    res.json({
      success: true,
      reviews: reviewList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      stats: {
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews: totalCount,
        ratingBreakdown: ratingBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
      }
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Get recent reviews for homepage/marketing
router.get('/recent', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const database = await initDB();
    const reviews = database.collection('reviews');
    const professionals = database.collection('professionals');

    const recentReviews = await reviews.aggregate([
      {
        $match: {
          isApproved: true,
          isPublic: true,
          rating: { $gte: 4 } // Only show 4+ star reviews for marketing
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'professionals',
          localField: 'professionalId',
          foreignField: '_id',
          as: 'professional'
        }
      },
      {
        $unwind: '$professional'
      },
      {
        $project: {
          homeownerName: 1,
          rating: 1,
          reviewText: 1,
          serviceType: 1,
          createdAt: 1,
          'professional.name': 1,
          'professional.services': 1
        }
      }
    ]).toArray();

    res.json({
      success: true,
      reviews: recentReviews
    });

  } catch (error) {
    console.error('Recent reviews fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent reviews'
    });
  }
});

// Professional can respond to a review
router.post('/:reviewId/respond', async (req, res) => {
  try {
    // This would require authentication middleware for professionals
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required'
      });
    }

    const database = await initDB();
    const reviews = database.collection('reviews');

    const result = await reviews.updateOne(
      { _id: new ObjectId(reviewId) },
      { 
        $set: { 
          professionalResponse: response,
          responseDate: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Response added successfully'
    });

  } catch (error) {
    console.error('Review response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  }
});

export default router;