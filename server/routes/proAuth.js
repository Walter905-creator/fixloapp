const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { sign } = require('../utils/jwt');
const Pro = require('../models/Pro');

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    // Trim and lowercase inputs
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Lookup Pro by email (case-insensitive)
    const pro = await Pro.findOne({ email: trimmedEmail });
    
    // Check if password exists in database
    if (pro && !pro.password) {
      return res.status(401).json({ error: 'This account has no password configured.' });
    }

    // Prevent timing attacks: always run bcrypt.compare even if user not found
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123';
    const passwordToCompare = pro?.password || dummyHash;
    const ok = await bcrypt.compare(trimmedPassword, passwordToCompare);

    // After constant-time comparison, check if user was found
    if (!pro || !ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT with required fields
    const token = sign({ id: pro._id, role: 'pro', email: pro.email });
    
    // Respond with success and user data
    res.json({ 
      success: true,
      token, 
      pro: { 
        id: pro._id, 
        name: pro.name, 
        trade: pro.trade,
        email: pro.email,
        phone: pro.phone
      } 
    });
  } catch (error) {
    console.error('Pro login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;