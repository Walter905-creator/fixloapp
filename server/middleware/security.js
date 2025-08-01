// Security headers middleware for Fixlo backend
const securityHeaders = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Content Security Policy for API endpoints
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'none'; object-src 'none';");
  }

  next();
};

module.exports = securityHeaders;
