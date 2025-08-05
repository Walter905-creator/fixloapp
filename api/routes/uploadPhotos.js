import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { MongoClient } from 'mongodb';
import { verifyToken } from './proAuth.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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

// Upload work photos endpoint
router.post('/work', verifyToken, upload.array('photos', 10), async (req, res) => {
  try {
    const { title, description, serviceType, clientName, completionDate } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one photo is required'
      });
    }

    if (!title || !description || !serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and service type are required'
      });
    }

    // Upload photos to Cloudinary
    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: `fixlo/professionals/${req.user.id}/work`,
            public_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                public_id: result.public_id,
                url: result.secure_url,
                thumbnail: result.secure_url.replace('/upload/', '/upload/w_300,h_200,c_fill/')
              });
            }
          }
        ).end(file.buffer);
      });
    });

    const uploadedPhotos = await Promise.all(uploadPromises);

    // Save work entry to database
    const database = await initDB();
    const workEntries = database.collection('work_entries');

    const workEntry = {
      professionalId: req.user.id,
      title,
      description,
      serviceType,
      clientName,
      completionDate: completionDate ? new Date(completionDate) : new Date(),
      photos: uploadedPhotos,
      createdAt: new Date(),
      isPublic: true
    };

    const result = await workEntries.insertOne(workEntry);

    console.log(`📸 Work photos uploaded: ${uploadedPhotos.length} photos for professional ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Work photos uploaded successfully',
      workEntry: {
        id: result.insertedId,
        ...workEntry
      }
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error.message
    });
  }
});

// Get professional's work gallery
router.get('/gallery/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const database = await initDB();
    const workEntries = database.collection('work_entries');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const works = await workEntries
      .find({ 
        professionalId,
        isPublic: true 
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalCount = await workEntries.countDocuments({ 
      professionalId,
      isPublic: true 
    });

    res.json({
      success: true,
      works,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Gallery fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work gallery'
    });
  }
});

// Delete work entry (professional only)
router.delete('/work/:workId', verifyToken, async (req, res) => {
  try {
    const { workId } = req.params;

    const database = await initDB();
    const workEntries = database.collection('work_entries');

    // Find the work entry
    const workEntry = await workEntries.findOne({ 
      _id: workId,
      professionalId: req.user.id 
    });

    if (!workEntry) {
      return res.status(404).json({
        success: false,
        message: 'Work entry not found'
      });
    }

    // Delete photos from Cloudinary
    const deletePromises = workEntry.photos.map(photo => 
      cloudinary.uploader.destroy(photo.public_id)
    );
    await Promise.all(deletePromises);

    // Delete work entry from database
    await workEntries.deleteOne({ _id: workId });

    console.log(`🗑️ Work entry deleted: ${workId} by professional ${req.user.id}`);

    res.json({
      success: true,
      message: 'Work entry deleted successfully'
    });

  } catch (error) {
    console.error('Work entry deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete work entry'
    });
  }
});

export default router;