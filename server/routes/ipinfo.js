const express = require('express');
const axios = require('axios');
const router = express.Router();

// IP information endpoint - proxy for ipapi.co to avoid CORS issues
router.get('/ipinfo', async (req, res) => {
  try {
    console.log('📍 Fetching IP information...');
    const response = await axios.get('https://ipapi.co/json', {
      timeout: 5000,
      headers: {
        'User-Agent': 'Fixlo/1.0.0'
      }
    });
    
    console.log('✅ IP info retrieved successfully');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Failed to fetch IP info:', error.message);
    
    // Return fallback data if the API fails
    res.json({
      city: 'your city',
      region: '',
      country: '',
      error: 'Unable to fetch location data'
    });
  }
});

module.exports = router;