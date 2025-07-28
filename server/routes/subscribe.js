// server/routes/subscribe.js
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  // Example: Store or forward to CRM/mailing list (stub only)
  console.log(`📩 New subscription: ${name} <${email}>`);

  res.json({ success: true, message: 'Subscription received successfully' });
});

module.exports = router;