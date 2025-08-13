const express = require('express');
const router = express.Router();
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/cloudinary/sign
// Generate signature for secure Cloudinary uploads
router.post('/sign', (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ 
        error: 'Cloudinary not configured',
        message: 'Upload service is not available'
      });
    }

    const { folder = 'pros', upload_preset } = req.body;
    
    // Generate timestamp
    const timestamp = Math.round(Date.now() / 1000);
    
    // Default optimized transformation (f_auto for format, q_auto for quality)
    const defaultTransformation = 'f_auto,q_auto,w_800,h_600,c_limit';
    const transformation = req.body.transformation || defaultTransformation;
    
    // Prepare parameters to sign
    const params = {
      timestamp,
      folder,
      use_filename: true,
      unique_filename: true,
      transformation,
      ...(upload_preset && { upload_preset })
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

    // Return signature and required parameters
    res.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder,
      use_filename: true,
      unique_filename: true,
      transformation,
      ...(upload_preset && { upload_preset })
    });
  } catch (error) {
    console.error('Cloudinary signing error:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload signature',
      message: error.message 
    });
  }
});

module.exports = router;