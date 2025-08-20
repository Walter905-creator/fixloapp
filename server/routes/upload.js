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

// Upload configuration for images only
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

// Upload configuration for all file types (for client folder uploads)
const uploadAny = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept images, documents, and common file types
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'video/mp4',
      'video/mpeg',
      'video/quicktime'
    ];
    
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type);
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Supported types: images, PDFs, Word docs, Excel files, text files, and videos'), false);
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
        error: 'Image upload service not configured. Please configure Cloudinary credentials in environment variables.',
        details: {
          CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'missing',
          CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'configured' : 'missing',
          CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'configured' : 'missing'
        }
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

// Client folder upload endpoint (supports multiple files and documents)
router.post('/client', uploadAny.array('files', 20), async (req, res) => {
  try {
    console.log('📤 Client folder upload request received');
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing');
      return res.status(500).json({
        success: false,
        error: 'File upload service not configured. Please configure Cloudinary credentials in environment variables.'
      });
    }

    console.log(`📁 Uploading ${req.files.length} client files to Cloudinary`);

    // Extract form data
    const { clientName, projectType, description, folderName } = req.body;
    const targetFolder = folderName || `fixlo/clients/${clientName || 'unnamed'}-${Date.now()}`;

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        // Determine resource type based on file
        let resourceType = 'auto';
        if (file.mimetype.startsWith('image/')) {
          resourceType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          resourceType = 'video';
        } else {
          resourceType = 'raw'; // For documents, PDFs, etc.
        }

        cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder: targetFolder,
            use_filename: true,
            unique_filename: true,
            transformation: resourceType === 'image' ? [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ] : undefined
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('✅ Client file uploaded:', result.public_id);
              resolve({
                originalName: file.originalname,
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type,
                format: result.format,
                bytes: result.bytes,
                width: result.width,
                height: result.height
              });
            }
          }
        ).end(file.buffer);
      });
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`✅ Successfully uploaded ${uploadedFiles.length} client files to folder: ${targetFolder}`);

    res.json({
      success: true,
      message: 'Client folder uploaded successfully',
      data: {
        folderName: targetFolder,
        clientInfo: {
          clientName,
          projectType,
          description,
          uploadedAt: new Date()
        },
        files: uploadedFiles,
        fileCount: uploadedFiles.length
      }
    });

  } catch (error) {
    console.error('❌ Client folder upload endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Client folder upload failed'
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
        error: 'Image upload service not configured. Please configure Cloudinary credentials in environment variables.'
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