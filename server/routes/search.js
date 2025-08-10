const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');

const BOOST_WEIGHT = parseFloat(process.env.BOOST_WEIGHT || '10'); // tweak as needed
const RATING_WEIGHT = parseFloat(process.env.RATING_WEIGHT || '1.5');
const RECENCY_WEIGHT = parseFloat(process.env.RECENCY_WEIGHT || '0.1'); // recent activity bonus

// GET /api/search/pros
// Search for professionals with boost-aware scoring
router.get('/search/pros', async (req, res) => {
  try {
    const { service, lat, lng, radiusMiles = 30 } = req.query;
    const now = new Date();

    // Build search query
    let searchQuery = { isActive: true };
    
    // Add service filter if provided
    if (service) {
      // Map common service names to trade types
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
      
      const trade = serviceToTrade[service.toLowerCase()] || service.toLowerCase();
      searchQuery.trade = trade;
    }

    // Add location filter if coordinates provided
    if (lat && lng) {
      const radiusInMeters = radiusMiles * 1609.34; // Convert miles to meters
      searchQuery.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    // Fetch candidates
    const candidates = await Pro.find(searchQuery)
      .select('name firstName lastName businessName trade primaryService location avgRating reviewCount completedJobs badges boostActiveUntil updatedAt slug')
      .lean();

    // Score and sort results
    const scored = candidates.map(p => {
      const boosted = p.boostActiveUntil && new Date(p.boostActiveUntil) > now;
      const rating = p.avgRating || p.rating || 0;
      const recent = p.updatedAt ? (now - new Date(p.updatedAt)) / (1000 * 60 * 60 * 24) : 999; // days ago
      const recencyScore = Math.max(0, (30 - recent)) * RECENCY_WEIGHT; // decay after ~30 days

      let score = rating * RATING_WEIGHT + recencyScore;
      if (boosted) score += BOOST_WEIGHT;

      return { ...p, _score: score, _boosted: boosted };
    }).sort((a, b) => b._score - a._score);

    res.json({ ok: true, results: scored });
  } catch (e) {
    console.error('search error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;