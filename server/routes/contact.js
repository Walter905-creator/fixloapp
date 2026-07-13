const express = require('express');
const router = express.Router();
const { notify: ownerNotify } = require('../services/ownerNotificationService');

/**
 * Contact form submission
 * POST /api/contact
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Log contact submission (in production, you might save to database or send email)
    console.log('📩 Contact form submission:', {
      name,
      email,
      subject,
      message: message.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // Fire-and-forget owner email notification
    ownerNotify('contact_form', { name, email, subject, message }).catch(() => {});

    res.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
});

module.exports = router;