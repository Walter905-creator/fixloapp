// Vercel Serverless Function for Professional Registration
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
    const { name, email, password, phone, trade, location, dob } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required'
      });
    }

    // Validate password length
    if (password.length < 6) {
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
        return res.status(400).json({
          success: false,
          message: 'You must be 18 or older to join as a professional'
        });
      }
    }

    console.log(`Professional registration attempt: ${name} (${email})`);
    
    // Mock successful registration response
    // This should be replaced with actual database integration
    const mockToken = 'mock-jwt-token-' + Date.now();
    const mockProfessional = {
      id: 'mock-id-' + Date.now(),
      name: name,
      email: email,
      phone: phone,
      services: [trade],
      location: location,
      rating: 0,
      reviewCount: 0
    };

    res.status(201).json({
      success: true,
      message: 'Professional account created successfully',
      token: mockToken,
      professional: mockProfessional
    });

  } catch (error) {
    console.error('Professional registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
}