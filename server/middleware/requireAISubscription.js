const { verify } = require('../utils/jwt');
const Pro = require('../models/Pro');

/**
 * Middleware to verify active AI Home Expert subscription ($19.99/mo)
 * 
 * Validates:
 * 1. User has valid JWT token
 * 2. User exists in database
 * 3. User has active AI subscription (aiSubscriptionStatus === 'active')
 * 
 * Returns:
 * - 401 if no/invalid token
 * - 403 if subscription is inactive or missing
 * - Continues to next middleware if active
 */
module.exports = async (req, res, next) => {
  try {
    // Step 1: Validate JWT token
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let user;
    try {
      user = verify(token);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Step 2: Look up Pro by email from token
    const pro = await Pro.findOne({ email: user.email });
    
    if (!pro) {
      return res.status(403).json({ error: 'AI subscription required' });
    }

    // Step 3: Verify active AI subscription
    if (pro.aiSubscriptionStatus !== 'active') {
      return res.status(403).json({ error: 'AI subscription required' });
    }

    // Attach user and pro to request for downstream use
    req.user = user;
    req.pro = pro;
    
    // Continue to next middleware/handler
    next();
  } catch (error) {
    console.error('❌ AI subscription check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
