const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const raw = req.header('Authorization') || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;

    if (!token) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Support both token payload shapes: { proId } (legacy) and { id } (current)
    req.proId = decoded.proId || decoded.id;
    req.email = decoded.email;
    req.user = decoded;

    console.log(`🔐 Auth: token valid for proId=${req.proId}`);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
};

module.exports = auth;