// routes/checkrRoutes.js
// Checkr Background Check Integration for Fixlo Pro Onboarding
// Handles candidate creation, invitation sending, and webhook processing

const express = require('express');
const crypto = require('crypto');
const Pro = require('../models/Pro');
const { sendSms } = require('../utils/twilio');
const { getCheckrConfig, checkrApiRequest } = require('../utils/checkr');

const router = express.Router();

/**
 * Verify Checkr webhook signature
 * @param {string} signature - Signature from X-Checkr-Signature header
 * @param {string} payload - Raw request body as string
 * @returns {boolean} True if signature is valid
 */
function verifyCheckrSignature(signature, payload) {
  const webhookSecret = process.env.CHECKR_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('⚠️ CHECKR_WEBHOOK_SECRET not configured - skipping signature verification');
    return true; // Allow through in development
  }
  
  if (!signature) {
    console.warn('⚠️ No X-Checkr-Signature header present');
    return false;
  }
  
  try {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    
    console.log(`🔐 Webhook signature validation: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error.message);
    return false;
  }
}

/**
 * Send notification to Pro about background check status change
 * @param {Object} pro - Pro document from MongoDB
 * @param {string} status - New background check status
 */
async function notifyProOfStatusChange(pro, status) {
  try {
    // Map status to user-friendly message
    let message = '';
    switch (status) {
      case 'clear':
        message = `Great news! Your Fixlo background check is complete and you're cleared to start accepting jobs. Welcome to the team! 🎉`;
        break;
      case 'consider':
        message = `Your Fixlo background check requires additional review. Our team will contact you within 24 hours. Questions? Reply to this message.`;
        break;
      case 'pending':
        message = `Your Fixlo background check is in progress. We'll notify you as soon as it's complete. This typically takes 1-3 business days.`;
        break;
      default:
        message = `Your Fixlo background check status has been updated to: ${status}. Our team will contact you with next steps.`;
    }
    
    // Send SMS if Pro has SMS notifications enabled and phone number
    if (pro.notificationSettings.sms && pro.phone) {
      console.log(`📱 Sending SMS notification to Pro ${pro._id}`);
      await sendSms(pro.phone, message);
    }
    
    // TODO: Add email notification support when email service is configured
    // if (pro.notificationSettings?.email && pro.email) {
    //   await sendEmail(pro.email, 'Background Check Update', message);
    // }
    
    console.log(`✅ Notification sent to Pro ${pro._id} for status: ${status}`);
  } catch (error) {
    console.error('❌ Failed to send notification:', error.message);
    // Don't throw - notification failure shouldn't break the webhook
  }
}

/* --------------------------------- Routes --------------------------------- */

/**
 * POST /api/checkr/createCandidate
 * Create a Checkr candidate and send background check invitation
 * 
 * Request body:
 * - proId: MongoDB _id of the Pro
 * - email: Pro's email address
 * - phone: Pro's phone number
 * - firstName: Pro's first name
 * - lastName: Pro's last name
 * - dob: Date of birth (YYYY-MM-DD)
 * - ssn: Social Security Number (for background check)
 * - zipcode: ZIP code for address verification
 */
router.post('/createCandidate', async (req, res) => {
  try {
    const { proId, email, phone, firstName, lastName, dob, ssn, zipcode } = req.body;
    
    // Validate required fields
    if (!proId || !email || !phone || !firstName || !lastName || !dob || !ssn || !zipcode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'All fields are required: proId, email, phone, firstName, lastName, dob, ssn, zipcode'
      });
    }
    
    // Verify Checkr is configured
    const config = getCheckrConfig();
    if (!config) {
      return res.status(503).json({
        success: false,
        error: 'Service not configured',
        message: 'Background check service is not available'
      });
    }
    
    // Find the Pro in database
    const pro = await Pro.findById(proId);
    if (!pro) {
      return res.status(404).json({
        success: false,
        error: 'Pro not found',
        message: `No professional found with ID: ${proId}`
      });
    }
    
    // Check if candidate already exists
    if (pro.checkrCandidateId) {
      console.log(`⚠️ Pro ${proId} already has candidate ID: ${pro.checkrCandidateId}`);
      return res.status(200).json({
        success: true,
        message: 'Candidate already exists',
        candidateId: pro.checkrCandidateId,
        alreadyExists: true
      });
    }
    
    console.log(`📋 Creating Checkr candidate for Pro ${proId}`);
    
    // Step 1: Create Checkr candidate
    const candidateData = {
      email: email.toLowerCase(),
      phone: phone,
      first_name: firstName,
      last_name: lastName,
      dob: dob, // Format: YYYY-MM-DD
      ssn: ssn,
      zipcode: zipcode,
    };
    
    const candidate = await checkrApiRequest('POST', '/candidates', candidateData);
    
    console.log(`✅ Checkr candidate created: ${candidate.id}`);
    
    // Step 2: Create background check invitation using "tasker_standard" package
    const invitationData = {
      candidate_id: candidate.id,
      package: 'tasker_standard', // Standard background check package for gig workers
    };
    
    const invitation = await checkrApiRequest('POST', '/invitations', invitationData);
    
    console.log(`✅ Checkr invitation created: ${invitation.id}`);
    
    // Step 3: Update Pro record with Checkr IDs
    pro.checkrCandidateId = candidate.id;
    pro.checkrInvitationId = invitation.id;
    pro.backgroundCheckStatus = 'pending';
    await pro.save();
    
    console.log(`✅ Pro ${proId} updated with Checkr candidate and invitation IDs`);
    
    // Step 4: Send notification to Pro
    await notifyProOfStatusChange(pro, 'pending');
    
    return res.status(201).json({
      success: true,
      message: 'Background check initiated successfully',
      candidateId: candidate.id,
      invitationId: invitation.id,
      invitationUrl: invitation.invitation_url,
      status: 'pending'
    });
    
  } catch (error) {
    console.error('❌ Create candidate error:', error.message);
    
    // Handle specific Checkr API errors
    if (error.response?.status === 422) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.response.data?.error || 'Invalid data provided to background check service'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to create background check candidate'
    });
  }
});

/**
 * POST /api/checkr/webhook
 * Handle webhook events from Checkr
 * 
 * Supported event types:
 * - invitation.created: Invitation was created
 * - invitation.completed: Candidate completed the invitation
 * - report.completed: Background check report is ready
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get raw body for signature verification
    const rawBody = req.body.toString('utf8');
    const signature = req.headers['x-checkr-signature'];
    
    console.log('📨 Checkr webhook received');
    
    // Verify webhook signature
    if (!verifyCheckrSignature(signature, rawBody)) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }
    
    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ Failed to parse webhook payload:', parseError.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload'
      });
    }
    
    const { type, data } = payload;
    
    console.log(`📬 Webhook event type: ${type}`);
    console.log(`📬 Event data:`, JSON.stringify(data, null, 2));
    
    // Handle different event types
    switch (type) {
      case 'invitation.created':
        console.log(`✅ Invitation created: ${data.object?.id}`);
        // No action needed - already handled in createCandidate
        break;
        
      case 'invitation.completed':
        console.log(`✅ Invitation completed: ${data.object?.id}`);
        // Candidate has completed the invitation - update status
        if (data.object?.candidate_id) {
          const pro = await Pro.findOne({ checkrCandidateId: data.object.candidate_id });
          if (pro) {
            pro.backgroundCheckStatus = 'pending';
            await pro.save();
            console.log(`✅ Updated Pro ${pro._id} status to pending (invitation completed)`);
          }
        }
        break;
        
      case 'report.completed':
        console.log(`📋 Report completed: ${data.object?.id}`);
        
        // Step 1: Extract report details
        const reportId = data.object?.id;
        const candidateId = data.object?.candidate_id;
        const reportStatus = data.object?.status; // 'clear', 'consider', 'suspended'
        
        if (!candidateId || !reportId) {
          console.warn('⚠️ Report webhook missing candidate_id or report_id');
          break;
        }
        
        // Step 2: Find Pro by candidate ID
        const pro = await Pro.findOne({ checkrCandidateId: candidateId });
        
        if (!pro) {
          console.warn(`⚠️ No Pro found for candidate ID: ${candidateId}`);
          break;
        }
        
        console.log(`📋 Processing report for Pro ${pro._id}`);
        
        // Step 3: Fetch full report details from Checkr API (optional, for more info)
        let fullReport;
        try {
          fullReport = await checkrApiRequest('GET', `/reports/${reportId}`);
          console.log(`📋 Full report retrieved for ${reportId}`);
        } catch (reportError) {
          console.warn('⚠️ Could not fetch full report details:', reportError.message);
          // Continue with webhook data
        }
        
        // Step 4: Map Checkr status to our system status
        let newStatus = 'pending';
        if (reportStatus === 'clear') {
          newStatus = 'clear';
        } else if (reportStatus === 'consider') {
          newStatus = 'consider';
        } else if (reportStatus === 'suspended') {
          newStatus = 'suspended';
        }
        
        // Step 5: Update Pro record
        pro.checkrReportId = reportId;
        pro.backgroundCheckStatus = newStatus;
        
        // If clear, activate the pro
        if (newStatus === 'clear') {
          pro.isVerified = true;
          pro.verificationStatus = 'verified';
          pro.verificationDate = new Date();
        }
        
        await pro.save();
        
        console.log(`✅ Pro ${pro._id} updated: status=${newStatus}, reportId=${reportId}`);
        
        // Step 6: Send notification to Pro
        await notifyProOfStatusChange(pro, newStatus);
        
        break;
        
      default:
        console.log(`ℹ️ Unhandled webhook event type: ${type}`);
    }
    
    // Always return 200 to acknowledge receipt
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      eventType: type
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    console.error(error.stack);
    
    // Still return 200 to prevent Checkr from retrying
    // Log the error for manual investigation
    return res.status(200).json({
      success: false,
      error: 'Internal processing error',
      message: error.message
    });
  }
});

/**
 * GET /api/checkr/test
 * Test endpoint to verify routes are working
 */
router.get('/test', (req, res) => {
  res.json({
    message: 'Checkr routes are working!',
    timestamp: new Date().toISOString(),
    configured: !!process.env.CHECKR_API_KEY
  });
});

module.exports = router;
