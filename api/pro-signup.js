// Vercel Serverless Function for Professional Signup
import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req, res) {
  // Enhanced CORS handling
  const origin = req.headers.origin || req.headers.referer?.split('/')[2] || '';
  const allowedOrigins = [
    'https://www.fixloapp.com',
    'https://fixloapp.com',
    'https://fixloapp.vercel.app',
    'http://localhost:3000'
  ];
  
  // Set CORS headers for allowed origins
  const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')));
  
  if (isAllowedOrigin || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || 'https://www.fixloapp.com');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('🔧 Pro-signup OPTIONS request handled');
    return res.status(204).end();
  }

  // Only allow POST requests for actual signup
  if (req.method !== 'POST') {
    console.log(`❌ Method ${req.method} not allowed for pro-signup`);
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed. Use POST for professional signup.` 
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
    // Forward to backend API for processing
    const backendUrl = 'https://fixloapp.onrender.com/api/pro-signup';
    console.log(`🔄 Forwarding signup to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Fixlo-Frontend/1.0'
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
      })
    });

    const backendResult = await response.json();
    
    if (response.ok && backendResult.success) {
      console.log(`✅ Professional signup successful: ${name} (${email})`);
      
      return res.json({
        success: true,
        message: "Professional registration created! Redirecting to payment...",
        data: backendResult.data,
        paymentUrl: backendResult.paymentUrl
      });
    } else {
      console.error('❌ Backend signup failed:', backendResult);
      return res.status(response.status || 500).json({
        success: false,
        message: backendResult.message || 'Registration failed. Please try again.'
      });
    }

  } catch (error) {
    console.error('❌ Error processing professional signup:', error);
    
    // Fallback: Accept the signup and provide manual processing message
    console.log(`📝 Fallback processing for: ${name} (${email}) - ${trade} in ${location}`);
    
    return res.json({ 
      success: true, 
      message: "Professional signup received! We're processing your registration and will contact you soon.",
      data: { 
        name, 
        email, 
        phone, 
        trade, 
        location,
        status: 'pending_manual_processing'
      },
      paymentUrl: `https://www.fixloapp.com/payment-success.html?manual=true&email=${encodeURIComponent(email)}`
    });
  }
}
