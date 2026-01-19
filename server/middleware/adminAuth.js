const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('🚫 Admin access denied: Missing authorization header');
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has admin role OR isAdmin flag (for owner)
    const hasAdminAccess = decoded.role === "admin" || decoded.isAdmin === true;
    
    if (!hasAdminAccess) {
      console.log(`🚫 Admin access denied: User role=${decoded.role}, isAdmin=${decoded.isAdmin}`);
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    
    console.log(`✅ Admin access granted: role=${decoded.role}, isAdmin=${decoded.isAdmin}`);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(`🚫 Admin access denied: Invalid token - ${err.message}`);
    res.status(401).json({ error: "Invalid token" });
  }
};
