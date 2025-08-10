const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');

// GET /api/profiles/slug/:slug
// Get a professional's profile by their slug
router.get('/profiles/slug/:slug', async (req, res) => {
  try {
    const pro = await Pro.findOne({ slug: req.params.slug })
      .select('firstName lastName businessName primaryService city state slug avgRating reviewCount badges boostActiveUntil name trade')
      .lean();
    if (!pro) return res.status(404).json({ error: 'Not found' });
    res.json(pro);
  } catch (e) {
    console.error('profiles slug error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;