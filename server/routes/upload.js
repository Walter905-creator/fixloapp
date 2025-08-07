const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload endpoint
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Image upload request received');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing');
      return res.status(500).json({
        success: false,
        error: 'Image upload service not configured'
      });
    }

    console.log('📁 Uploading to Cloudinary:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'fixlo/uploads', // Use the folder specified in problem statement
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Limit max dimensions for profiles
            { quality: 'auto' }, // Auto optimize quality
            { fetch_format: 'auto' } // Auto choose best format
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result.public_id);
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    // Return success response with image URL
    res.json({
      success: true,
      url: result.secure_url, // Return url field as specified in problem statement
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    });

  } catch (error) {
    console.error('❌ Upload endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed'
    });
  }
});

// Delete image endpoint (optional)
router.delete('/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    console.log('🗑️ Deleting image from Cloudinary:', publicId);
    
    const result = await cloudinary.uploader.destroy(`fixlo-pro-images/${publicId}`);
    
    if (result.result === 'ok') {
      console.log('✅ Image deleted successfully');
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      console.log('⚠️ Image not found or already deleted');
      res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
  } catch (error) {
    console.error('❌ Delete endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

// Work portfolio upload endpoint (supports multiple images)
router.post('/work', upload.array('photos', 10), async (req, res) => {
  try {
    console.log('📤 Work portfolio upload request received');
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No photos provided'
      });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing');
      return res.status(500).json({
        success: false,
        error: 'Image upload service not configured'
      });
    }

    console.log(`📁 Uploading ${req.files.length} work photos to Cloudinary`);

    // Extract form data
    const { title, description, serviceType, clientName, completionDate } = req.body;

    // Upload all images to Cloudinary
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'fixlo/work-portfolio',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('✅ Work photo uploaded:', result.public_id);
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
              });
            }
          }
        ).end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // TODO: Save work portfolio data to database
    // For now, just return success with uploaded image URLs
    
    console.log(`✅ Successfully uploaded ${uploadedImages.length} work portfolio images`);

    res.json({
      success: true,
      message: 'Work portfolio uploaded successfully',
      data: {
        workEntry: {
          title,
          description,
          serviceType,
          clientName,
          completionDate,
          images: uploadedImages,
          uploadedAt: new Date()
        },
        imageCount: uploadedImages.length
      }
    });

  } catch (error) {
    console.error('❌ Work upload endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Work portfolio upload failed'
    });
  }
});

module.exports = router;