const { verify } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    req.user = verify(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};