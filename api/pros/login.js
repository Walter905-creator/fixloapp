// Vercel Serverless Function for Professional Login
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
    console.log(`🎯 OPTIONS /api/pros/login from origin: "${origin || 'null'}"`);
    res.status(200).end();
    return;
  }
  
  // Only allow POST method for login
  if (req.method !== 'POST') {
    console.log(`❌ Method ${req.method} not allowed for /api/pros/login`);
    res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed. Use POST for login.`,
      allowedMethods: ['POST', 'OPTIONS']
    });
    return;
  }

  try {
    console.log('🔐 Professional login request received');
    
    // Extract login credentials
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
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

    console.log(`🔍 Professional login attempt: ${email}`);
    
    // TODO: Replace with actual database authentication
    // This is a mock implementation for now - should integrate with MongoDB/database
    
    // Mock authentication logic (replace with real implementation)
    if (email === 'demo@fixlo.com' && password === 'demo123') {
      // Mock successful login response
      const mockToken = 'jwt-token-' + Date.now();
      const mockProfessional = {
        id: 'pro-' + Date.now(),
        name: 'Demo Professional',
        email: email,
        phone: '555-0123',
        trade: 'plumbing',
        location: 'New York, NY',
        rating: 4.8,
        reviewCount: 25,
        isActive: true,
        isVerified: true
      };

      console.log(`✅ Successful login for: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: mockToken,
        professional: mockProfessional
      });
    } else {
      // Mock authentication failure
      console.log(`❌ Authentication failed for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

  } catch (error) {
    console.error('❌ Professional login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}