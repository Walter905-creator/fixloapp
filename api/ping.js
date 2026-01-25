// VERCEL_API_HEALTHCHECK — must return JSON, never HTML

/**
 * Vercel Serverless Function: /api/ping
 * 
 * Simple health check endpoint to verify API routing is working.
 * Returns current timestamp and status.
 * 
 * This endpoint does NOT require database connection and will always respond.
 */

export default function handler(req, res) {
  // Log API hit (non-sensitive)
  console.log('[API /ping] Health check request', {
    method: req.method,
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'unknown',
  });

  // Set security headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // CORS headers for allowed origins
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://www.fixloapp.com',
    'https://fixloapp.com',
    'http://localhost:3000',
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.warn('[API /ping] Invalid method attempted:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET'],
    });
  }

  // Return success response
  const response = {
    ok: true,
    timestamp: new Date().toISOString(),
    message: 'Fixlo API is operational',
    environment: process.env.VERCEL_ENV || 'development',
    region: process.env.VERCEL_REGION || 'unknown',
  };

  console.log('[API /ping] Responding with:', response);
  
  return res.status(200).json(response);
}
