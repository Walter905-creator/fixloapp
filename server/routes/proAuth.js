const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { sign } = require('../utils/jwt');
const Pro = require('../models/Pro');

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const pro = await Pro.findOne({ email: email.toLowerCase() });
    if (!pro || !pro.password) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, pro.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign({ role: 'pro', id: pro._id, email: pro.email });
    res.json({ 
      token, 
      pro: { 
        id: pro._id, 
        name: pro.name, 
        trade: pro.trade,
        email: pro.email
      } 
    });
  } catch (error) {
    console.error('Pro login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;