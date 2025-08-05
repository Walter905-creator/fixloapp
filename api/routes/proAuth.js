import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const router = express.Router();

// MongoDB connection (will be initialized when route is used)
let db = null;

// Initialize MongoDB connection
async function initDB() {
  if (!db) {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixlo');
    await client.connect();
    db = client.db('fixlo');
  }
  return db;
}

// Professional signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, services, location } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required'
      });
    }

    const database = await initDB();
    const professionals = database.collection('professionals');

    // Check if professional already exists
    const existingPro = await professionals.findOne({ email });
    if (existingPro) {
      return res.status(400).json({
        success: false,
        message: 'Professional with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create professional document
    const professional = {
      name,
      email,
      password: hashedPassword,
      phone,
      services: services || [],
      location,
      createdAt: new Date(),
      verified: false,
      rating: 0,
      reviewCount: 0
    };

    const result = await professionals.insertOne(professional);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: result.insertedId,
        email,
        type: 'professional'
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    console.log(`✅ Professional signup: ${name} (${email})`);

    res.status(201).json({
      success: true,
      message: 'Professional account created successfully',
      token,
      professional: {
        id: result.insertedId,
        name,
        email,
        phone,
        services,
        location
      }
    });

  } catch (error) {
    console.error('Professional signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during signup'
    });
  }
});

// Professional login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const database = await initDB();
    const professionals = database.collection('professionals');

    // Find professional by email
    const professional = await professionals.findOne({ email });
    if (!professional) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, professional.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: professional._id,
        email: professional.email,
        type: 'professional'
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    console.log(`✅ Professional login: ${professional.name} (${email})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      professional: {
        id: professional._id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        services: professional.services,
        location: professional.location,
        rating: professional.rating,
        reviewCount: professional.reviewCount
      }
    });

  } catch (error) {
    console.error('Professional login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export default router;