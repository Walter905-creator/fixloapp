const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sign } = require('../utils/jwt');
const Pro = require('../models/Pro');
const { sendPasswordResetEmail, isEmailEnabled } = require('../utils/email');

// Pro login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const pro = await Pro.findOne({ email: email.toLowerCase() });
    if (!pro) return res.status(401).json({ error: 'Invalid credentials' });

    // Check if password is not set (null)
    if (!pro.password) {
      return res.status(403).json({ 
        error: 'Password not set. Please reset your password.',
        requiresPasswordReset: true
      });
    }

    const ok = await bcrypt.compare(password, pro.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign({ role: 'pro', id: pro._id, email: pro.email });
    res.json({ 
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

// Request password reset
router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body || {};
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const pro = await Pro.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we return success
    if (!pro) {
      console.log('Password reset requested for non-existent email:', email);
      return res.json({ 
        success: true,
        message: 'If this email exists, a reset link was sent.'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiration (1 hour)
    pro.passwordResetToken = hashedToken;
    pro.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pro.save();

    // Send reset email if email service is enabled
    if (isEmailEnabled()) {
      await sendPasswordResetEmail(pro.email, resetToken);
      console.log('✅ Password reset email sent to:', pro.email);
    } else {
      // In development, log a safe message without the token
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Email disabled - Reset token for', pro.email, ':', resetToken);
        console.log('🔗 Reset URL:', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pro/reset-password?token=${resetToken}`);
      } else {
        console.log('📧 Email disabled - Reset requested for:', pro.email);
      }
    }

    res.json({ 
      success: true,
      message: 'If this email exists, a reset link was sent.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find pro with valid token
    const pro = await Pro.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!pro) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    pro.password = hashedPassword;
    pro.passwordResetToken = null;
    pro.passwordResetExpires = null;
    await pro.save();

    console.log('✅ Password reset successful for:', pro.email);

    res.json({ 
      success: true,
      message: 'Password reset successful. You can now log in.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;