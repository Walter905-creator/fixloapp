// Vercel Serverless Function for Professional Registration
export default async function handler(req, res) {
  // Enable CORS - Allow specific origins for security
  const allowedOrigins = [
    'https://www.fixloapp.com',
    'https://fixloapp.com', 
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || 'https://www.fixloapp.com');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log(`🎯 OPTIONS /api/pros/register from origin: "${origin || 'null'}"`);
    res.status(200).end();
    return;
  }
  
  // Only allow POST method for registration
  if (req.method !== 'POST') {
    console.log(`❌ Method ${req.method} not allowed for /api/pros/register`);
    res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed. Use POST for registration.`,
      allowedMethods: ['POST', 'OPTIONS']
    });
    return;
  }

  try {
    console.log('📝 Professional registration request received');
    
    const { name, email, password, phone, trade, location, dob } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`❌ Invalid email format: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate age (if dob provided)
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age < 18) {
        console.log(`❌ Age verification failed: ${age} years old`);
        return res.status(400).json({
          success: false,
          message: 'You must be 18 or older to join as a professional'
        });
      }
    }

    console.log(`📝 Professional registration attempt: ${name} (${email})`);
    
    // TODO: Replace with actual database integration
    // Mock successful registration response
    const mockToken = 'jwt-token-' + Date.now();
    const mockProfessional = {
      id: 'pro-' + Date.now(),
      name: name,
      email: email,
      phone: phone,
      trade: trade || 'general',
      location: location || 'Not specified',
      rating: 0,
      reviewCount: 0,
      isActive: false, // Will be activated after payment
      isVerified: false,
      dateOfBirth: dob
    };

    console.log(`✅ Professional registration successful: ${name} (${email})`);
    res.status(201).json({
      success: true,
      message: 'Professional account created successfully',
      token: mockToken,
      professional: mockProfessional
    });

  } catch (error) {
    console.error('❌ Professional registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}