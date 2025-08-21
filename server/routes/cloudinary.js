const express = require('express');
const router = express.Router();
const { v2: cloudinary } = require('cloudinary');

// --- Configuration (env required) ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/cloudinary/sign
// Returns a signature + params for secure direct-to-Cloudinary uploads
router.post('/sign', (req, res) => {
  try {
    // Ensure config present
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(503).json({
        error: 'Cloudinary not configured',
        message: 'Upload service is not available',
      });
    }

    // Optional inputs from client
    const {
      folder = 'pros',             // e.g., keep all Pro images under /pros
      upload_preset,               // if you use unsigned presets, pass it through
      transformation,              // allow override, but default to optimized below
      public_id,                   // optional stable id
      context,                     // optional key=value|key=value pairs
      tags,                        // optional comma-separated tags
    } = req.body || {};

    // Safe, fast default optimization
    const defaultTransformation = 'f_auto,q_auto,w_800,h_600,c_limit';

    const timestamp = Math.floor(Date.now() / 1000);

    // Params that MUST be identical on the client upload call
    const paramsToSign = {
      timestamp,
      folder,
      use_filename: true,
      unique_filename: true,
      transformation: transformation || defaultTransformation,
      ...(upload_preset ? { upload_preset } : {}),
      ...(public_id ? { public_id } : {}),
      ...(context ? { context } : {}),
      ...(tags ? { tags } : {}),
    };

    // Create signature
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    // Respond with signature and required params
    return res.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder,
      use_filename: true,
      unique_filename: true,
      transformation: paramsToSign.transformation,
      ...(upload_preset ? { upload_preset } : {}),
      ...(public_id ? { public_id } : {}),
      ...(context ? { context } : {}),
      ...(tags ? { tags } : {}),
    });
  } catch (err) {
    console.error('Cloudinary signing error:', err);
    return res.status(500).json({
      error: 'Failed to generate upload signature',
      message: err?.message || 'Unknown error',
    });
  }
});

module.exports = router;
