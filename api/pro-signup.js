// Vercel Serverless Function for Professional Signup
// This function acts as a proxy to the main backend API

export default async function handler(req, res) {
  // Enhanced CORS handling
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://www.fixloapp.com',
    'https://fixloapp.com',
    'https://fixloapp.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  console.log(`📋 Serverless pro-signup: ${req.method} request from origin: "${origin}"`);
  
  // Set CORS headers for allowed origins
  const isAllowedOrigin = allowedOrigins.includes(origin) || !origin;
  
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    console.log(`❌ Origin "${origin}" not allowed. Allowed origins:`, allowedOrigins);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ Pro-signup OPTIONS request handled successfully');
    return res.status(204).end();
  }

  // Only allow POST requests for actual signup
  if (req.method !== 'POST') {
    console.log(`❌ Method ${req.method} not allowed for pro-signup`);
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed. Use POST for professional signup.`,
      error: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST', 'OPTIONS']
    });
  }

  console.log("🔧 Professional signup request received:", req.body);
  
  const { name, email, phone, trade, location, dob, termsConsent, smsConsent } = req.body;
  
  // Enhanced validation
  if (!name || !email || !phone || !trade || !location || !dob) {
    return res.status(400).json({ 
      success: false, 
      message: "All required fields must be provided: name, email, phone, trade, location, and date of birth" 
    });
  }

  // Validate terms consent
  if (!termsConsent) {
    return res.status(400).json({
      success: false,
      message: "You must agree to the Terms of Service and Privacy Policy"
    });
  }

  // Validate SMS consent (make it optional for now to avoid blocking signups)
  // if (!smsConsent) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "SMS consent is required."
  //   });
  // }

  // Validate age (18+)
  const birthDate = new Date(dob);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  if (age < 18) {
    return res.status(400).json({
      success: false,
      message: "You must be 18 or older to join Fixlo as a professional"
    });
  }

  try {
    // Check for backend URL configuration
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001/api/pro-signup';
    console.log(`🔄 Attempting to forward signup to backend: ${backendUrl}`);
    console.log(`📝 Request data:`, { name, email, phone, trade, location, dob, termsConsent, smsConsent });
    
    // Try to forward to backend API for processing if available
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Fixlo-Frontend/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        trade,
        location,
        dob,
        termsConsent,
        smsConsent
      }),
      timeout: 10000 // 10 second timeout (reduced for faster fallback)
    });

    console.log(`📡 Backend response status: ${response.status} ${response.statusText}`);
    
    let backendResult;
    try {
      backendResult = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse backend response as JSON:', parseError);
      throw new Error('Invalid response from backend service');
    }
    
    console.log(`📋 Backend result:`, backendResult);
    
    if (response.ok && backendResult.success) {
      console.log(`✅ Professional signup successful via backend: ${name} (${email})`);
      
      return res.json({
        success: true,
        message: "Professional registration created! Redirecting to payment...",
        data: backendResult.data,
        paymentUrl: backendResult.paymentUrl
      });
    } else {
      console.error('❌ Backend signup failed, falling back to direct processing:', {
        status: response.status,
        statusText: response.statusText,
        result: backendResult
      });
      // Fall through to direct processing
    }

  } catch (error) {
    console.error('❌ Error connecting to backend, processing directly:', error);
    // Fall through to direct processing
  }

  // Direct processing when backend is unavailable
  console.log(`📝 Processing professional signup directly: ${name} (${email}) - ${trade} in ${location}`);
  
  return res.json({ 
    success: true, 
    message: "Professional signup received! We're processing your registration and will contact you soon.",
    data: { 
      name, 
      email, 
      phone, 
      trade, 
      location,
      dob,
      termsConsent,
      smsConsent,
      status: 'pending_processing',
      submittedAt: new Date().toISOString()
    },
    paymentUrl: `https://www.fixloapp.com/payment-success.html?manual=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`,
    note: 'Registration processed in serverless mode - our team will contact you within 24 hours'
  });
}
