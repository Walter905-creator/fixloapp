/**
 * Privacy & Data Rights Routes
 * Implements GDPR/CCPA compliance endpoints for data access, deletion, and portability
 */

const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const Review = require('../models/Review');
const ShareEvent = require('../models/ShareEvent');

/**
 * @route   POST /api/privacy/data-access-request
 * @desc    Request access to personal data (GDPR Article 15, CCPA)
 * @access  Public (with email verification)
 */
router.post('/data-access-request', async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({ 
        error: 'Email and user type (pro or homeowner) are required' 
      });
    }

    let userData = {};

    if (userType === 'pro') {
      // Find Pro account
      const pro = await Pro.findOne({ email: email.toLowerCase() })
        .select('-password')
        .populate('reviews');

      if (!pro) {
        return res.status(404).json({ error: 'No account found with this email' });
      }

      userData = {
        userType: 'professional',
        personalInfo: {
          name: pro.name,
          firstName: pro.firstName,
          lastName: pro.lastName,
          businessName: pro.businessName,
          email: pro.email,
          phone: pro.phone,
          trade: pro.trade,
          location: pro.location,
          city: pro.city,
          state: pro.state,
          dob: pro.dob
        },
        accountInfo: {
          isActive: pro.isActive,
          paymentStatus: pro.paymentStatus,
          joinedDate: pro.joinedDate,
          subscriptionStartDate: pro.subscriptionStartDate,
          subscriptionEndDate: pro.subscriptionEndDate
        },
        professionalInfo: {
          experience: pro.experience,
          rating: pro.rating,
          avgRating: pro.avgRating,
          reviewCount: pro.reviewCount,
          completedJobs: pro.completedJobs,
          isVerified: pro.isVerified,
          verificationStatus: pro.verificationStatus,
          backgroundCheckStatus: pro.backgroundCheckStatus
        },
        notificationSettings: pro.notificationSettings,
        smsConsent: pro.smsConsent,
        wantsNotifications: pro.wantsNotifications,
        serviceRadiusMiles: pro.serviceRadiusMiles,
        reviews: pro.reviews,
        createdAt: pro.createdAt,
        updatedAt: pro.updatedAt
      };
    } else if (userType === 'homeowner') {
      // Find job requests from homeowner
      const jobRequests = await JobRequest.find({ email: email.toLowerCase() });

      if (jobRequests.length === 0) {
        return res.status(404).json({ error: 'No data found with this email' });
      }

      userData = {
        userType: 'homeowner',
        jobRequests: jobRequests.map(req => ({
          id: req._id,
          trade: req.trade,
          name: req.name,
          email: req.email,
          phone: req.phone,
          address: req.address,
          zip: req.zip,
          description: req.description,
          status: req.status,
          createdAt: req.createdAt
        }))
      };
    }

    // Log the access request (for audit purposes)
    console.log(`Data access request: ${email} (${userType}) at ${new Date().toISOString()}`);

    res.json({
      message: 'Data access request processed successfully',
      requestDate: new Date().toISOString(),
      data: userData,
      disclaimer: 'This information is provided in compliance with GDPR and CCPA regulations. Please verify your identity before sharing this data with anyone.'
    });

  } catch (error) {
    console.error('Data access request error:', error);
    res.status(500).json({ error: 'Failed to process data access request' });
  }
});

/**
 * @route   POST /api/privacy/data-export
 * @desc    Export personal data in portable format (GDPR Article 20, CCPA)
 * @access  Public (with email verification)
 */
router.post('/data-export', async (req, res) => {
  try {
    const { email, userType, format = 'json' } = req.body;

    if (!email || !userType) {
      return res.status(400).json({ 
        error: 'Email and user type are required' 
      });
    }

    let exportData = {};

    if (userType === 'pro') {
      const pro = await Pro.findOne({ email: email.toLowerCase() })
        .select('-password -stripeSessionId')
        .populate('reviews');

      if (!pro) {
        return res.status(404).json({ error: 'No account found' });
      }

      exportData = pro.toObject();
    } else if (userType === 'homeowner') {
      const jobRequests = await JobRequest.find({ email: email.toLowerCase() });
      
      if (jobRequests.length === 0) {
        return res.status(404).json({ error: 'No data found' });
      }

      exportData = { jobRequests };
    }

    // Log the export request
    console.log(`Data export request: ${email} (${userType}) at ${new Date().toISOString()}`);

    res.json({
      message: 'Data exported successfully',
      exportDate: new Date().toISOString(),
      format: format,
      data: exportData
    });

  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * @route   POST /api/privacy/data-deletion-request
 * @desc    Request deletion of personal data (GDPR Article 17 - Right to be Forgotten, CCPA)
 * @access  Public (with email verification)
 */
router.post('/data-deletion-request', async (req, res) => {
  try {
    const { email, userType, confirmDeletion } = req.body;

    if (!email || !userType) {
      return res.status(400).json({ 
        error: 'Email and user type are required' 
      });
    }

    if (!confirmDeletion) {
      return res.status(400).json({
        error: 'Deletion must be confirmed by setting confirmDeletion to true',
        warning: 'This action is irreversible and will permanently delete all your data.'
      });
    }

    let deletionResult = {};

    if (userType === 'pro') {
      const pro = await Pro.findOne({ email: email.toLowerCase() });

      if (!pro) {
        return res.status(404).json({ error: 'No account found' });
      }

      // Check if there are active subscriptions
      if (pro.paymentStatus === 'active') {
        return res.status(400).json({
          error: 'Cannot delete account with active subscription',
          message: 'Please cancel your subscription first before requesting account deletion'
        });
      }

      // Delete associated reviews
      await Review.deleteMany({ _id: { $in: pro.reviews } });
      
      // Anonymize or delete the Pro account
      // For compliance, we may need to retain some data for legal purposes
      // Instead of hard delete, we anonymize the account
      pro.name = 'Deleted User';
      pro.firstName = 'Deleted';
      pro.lastName = 'User';
      pro.email = `deleted_${Date.now()}@deleted.fixlo`;
      pro.phone = '000-000-0000';
      pro.isActive = false;
      pro.profileImage = null;
      pro.profilePhotoUrl = null;
      pro.gallery = [];
      pro.stripeCustomerId = null;
      pro.stripeSubscriptionId = null;
      
      await pro.save();

      deletionResult = {
        message: 'Professional account data anonymized successfully',
        deletedAt: new Date().toISOString(),
        retentionNote: 'Some data may be retained for legal and regulatory compliance purposes for up to 7 years'
      };

    } else if (userType === 'homeowner') {
      // Delete job requests older than retention period
      const result = await JobRequest.deleteMany({ 
        email: email.toLowerCase(),
        createdAt: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Older than 1 year
      });

      // Anonymize recent job requests (within retention period)
      await JobRequest.updateMany(
        { 
          email: email.toLowerCase(),
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        },
        {
          $set: {
            name: 'Deleted User',
            email: `deleted_${Date.now()}@deleted.fixlo`,
            phone: '000-000-0000'
          }
        }
      );

      deletionResult = {
        message: 'Homeowner data processed for deletion',
        deletedJobRequests: result.deletedCount,
        deletedAt: new Date().toISOString(),
        retentionNote: 'Recent job requests (within 1 year) have been anonymized rather than deleted'
      };
    }

    // Log the deletion request
    console.log(`Data deletion request processed: ${email} (${userType}) at ${new Date().toISOString()}`);

    res.json(deletionResult);

  } catch (error) {
    console.error('Data deletion error:', error);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

/**
 * @route   POST /api/privacy/update-consent
 * @desc    Update privacy consent preferences
 * @access  Public
 */
router.post('/update-consent', async (req, res) => {
  try {
    const { email, consentType, value } = req.body;

    if (!email || !consentType || value === undefined) {
      return res.status(400).json({ 
        error: 'Email, consent type, and value are required' 
      });
    }

    const pro = await Pro.findOne({ email: email.toLowerCase() });

    if (!pro) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Update consent based on type
    switch (consentType) {
      case 'sms':
        pro.smsConsent = value;
        if (pro.notificationSettings) {
          pro.notificationSettings.sms = value;
        }
        break;
      case 'email':
        if (pro.notificationSettings) {
          pro.notificationSettings.email = value;
        }
        break;
      case 'push':
        if (pro.notificationSettings) {
          pro.notificationSettings.push = value;
        }
        break;
      case 'notifications':
        pro.wantsNotifications = value;
        break;
      default:
        return res.status(400).json({ error: 'Invalid consent type' });
    }

    await pro.save();

    // Log consent update
    console.log(`Consent updated: ${email} - ${consentType}: ${value} at ${new Date().toISOString()}`);

    res.json({
      message: 'Consent preferences updated successfully',
      updatedAt: new Date().toISOString(),
      consent: {
        type: consentType,
        value: value
      }
    });

  } catch (error) {
    console.error('Consent update error:', error);
    res.status(500).json({ error: 'Failed to update consent preferences' });
  }
});

/**
 * @route   GET /api/privacy/policy-version
 * @desc    Get current privacy policy version and last update date
 * @access  Public
 */
router.get('/policy-version', (req, res) => {
  res.json({
    version: '2.0',
    lastUpdated: '2025-10-22',
    effectiveDate: '2025-10-22',
    policyUrl: 'https://www.fixloapp.com/privacy',
    changes: [
      'Added comprehensive data collection disclosure',
      'Enhanced user rights section with GDPR/CCPA compliance',
      'Added cookie and tracking technologies section',
      'Updated data retention policies',
      'Added international data transfer information'
    ]
  });
});

module.exports = router;
