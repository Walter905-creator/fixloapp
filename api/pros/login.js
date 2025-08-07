// Vercel Serverless Function for Professional Login
import { proAuth } from '../routes/proAuth.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
    return;
  }

  try {
    // Import and use the existing auth logic
    const { default: proAuthRouter } = await import('../routes/proAuth.js');
    
    // Create a mock request object that matches Express format
    const mockReq = {
      ...req,
      body: req.body
    };
    
    // Create a mock response object
    const mockRes = {
      status: (code) => {
        res.status(code);
        return mockRes;
      },
      json: (data) => {
        res.json(data);
        return mockRes;
      }
    };

    // Manual implementation based on proAuth.js login logic
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // For now, create a simple response that matches expected format
    // This should be replaced with actual database integration
    console.log(`Professional login attempt: ${email}`);
    
    // Mock successful login response
    const mockToken = 'mock-jwt-token-' + Date.now();
    const mockProfessional = {
      id: 'mock-id-' + Date.now(),
      name: 'Mock Professional',
      email: email,
      phone: '555-0123',
      services: ['plumbing'],
      location: 'New York, NY',
      rating: 4.5,
      reviewCount: 10
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: mockToken,
      professional: mockProfessional
    });

  } catch (error) {
    console.error('Professional login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
}