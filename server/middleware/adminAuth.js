const jwt = require("jsonwebtoken");

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    if (isDevelopment) console.log('🚫 Admin access denied: Missing authorization header');
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has admin role OR isAdmin flag (for owner)
    const hasAdminAccess = decoded.role === "admin" || decoded.isAdmin === true;
    
    if (!hasAdminAccess) {
      if (isDevelopment) {
        console.log(`🚫 Admin access denied: User role=${decoded.role}, isAdmin=${decoded.isAdmin}`);
      } else {
        console.log('🚫 Admin access denied: Insufficient permissions');
      }
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    
    if (isDevelopment) {
      console.log(`✅ Admin access granted: role=${decoded.role}, isAdmin=${decoded.isAdmin}`);
    } else {
      console.log('✅ Admin access granted');
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (isDevelopment) console.log(`🚫 Admin access denied: Invalid token - ${err.message}`);
    res.status(401).json({ error: "Invalid token" });
  }
};
